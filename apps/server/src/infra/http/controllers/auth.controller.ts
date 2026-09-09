import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from '@src/infra/auth/auth.service';
import {
  clientOrigin,
  createPkce,
  createState,
  discoverIssuer,
  readCookie,
  safeReturnTo,
} from '@src/infra/auth/oidc';
import { EnvService } from '@src/infra/env/env.service';
import type { Request, Response } from 'express';
import { LoginDto } from './dto/login.dto';

const TOKEN_MAX_AGE = 60 * 60 * 24 * 7;
const OIDC_COOKIE_MAX_AGE = 60 * 10;
const STATE_COOKIE = 'explainit_oidc_state';
const VERIFIER_COOKIE = 'explainit_oidc_verifier';
const RETURN_COOKIE = 'explainit_return_to';

@Controller('api/auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly env: EnvService,
  ) {}

  @Get('mode')
  mode() {
    return { mode: this.env.get('AUTH_MODE') };
  }

  @Get('login')
  async startLogin(
    @Query('returnTo') returnToRaw: string | undefined,
    @Res() res: Response,
  ) {
    const mode = this.env.get('AUTH_MODE');
    const returnTo = safeReturnTo(returnToRaw);
    const origin = clientOrigin(this.env.get('CORS_ORIGIN'));

    if (mode === 'none') {
      return res.redirect(`${origin}${returnTo}`);
    }

    if (mode === 'password') {
      return res.redirect(
        `${origin}/login?returnTo=${encodeURIComponent(returnTo)}`,
      );
    }

    const issuer = this.env.get('AUTH_ISSUER');
    const clientId = this.env.get('AUTH_CLIENT_ID');
    const redirectUri = this.env.get('AUTH_REDIRECT_URI');
    if (!issuer || !clientId || !redirectUri) {
      return res.status(500).json({ error: 'OIDC is not configured' });
    }

    const discovery = await discoverIssuer(issuer);
    const { verifier, challenge } = createPkce();
    const state = createState();
    const authorize = new URL(discovery.authorization_endpoint);
    authorize.searchParams.set('client_id', clientId);
    authorize.searchParams.set('redirect_uri', redirectUri);
    authorize.searchParams.set('response_type', 'code');
    authorize.searchParams.set('scope', 'openid email profile');
    authorize.searchParams.set('state', state);
    authorize.searchParams.set('code_challenge', challenge);
    authorize.searchParams.set('code_challenge_method', 'S256');

    const cookieOpts = this.oidcCookieOptions();
    res.cookie(STATE_COOKIE, state, cookieOpts);
    res.cookie(VERIFIER_COOKIE, verifier, cookieOpts);
    res.cookie(RETURN_COOKIE, returnTo, cookieOpts);
    return res.redirect(authorize.toString());
  }

  @Get('callback')
  async callback(@Req() req: Request, @Res() res: Response) {
    const origin = clientOrigin(this.env.get('CORS_ORIGIN'));
    const cookieHeader = req.headers.cookie;
    const code = typeof req.query.code === 'string' ? req.query.code : null;
    const state = typeof req.query.state === 'string' ? req.query.state : null;
    const expectedState = readCookie(cookieHeader, STATE_COOKIE);
    const verifier = readCookie(cookieHeader, VERIFIER_COOKIE);
    const returnTo = safeReturnTo(readCookie(cookieHeader, RETURN_COOKIE));

    const fail = (error: string) => {
      this.clearOidcCookies(res);
      return res.redirect(`${origin}/login?error=${encodeURIComponent(error)}`);
    };

    if (
      !code ||
      !state ||
      !expectedState ||
      state !== expectedState ||
      !verifier
    ) {
      return fail('oidc');
    }

    const issuer = this.env.get('AUTH_ISSUER');
    const clientId = this.env.get('AUTH_CLIENT_ID');
    const redirectUri = this.env.get('AUTH_REDIRECT_URI');
    if (!issuer || !clientId || !redirectUri) {
      return fail('config');
    }

    const discovery = await discoverIssuer(issuer);
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      client_id: clientId,
      code_verifier: verifier,
    });
    const clientSecret = this.env.get('AUTH_CLIENT_SECRET');
    if (clientSecret) {
      body.set('client_secret', clientSecret);
    }

    const tokenRes = await fetch(discovery.token_endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });

    if (!tokenRes.ok) {
      return fail('token');
    }

    const tokens = (await tokenRes.json()) as {
      id_token?: string;
      access_token?: string;
    };
    const accessToken = tokens.id_token || tokens.access_token;
    if (!accessToken) {
      return fail('token');
    }

    this.clearOidcCookies(res);
    return res.redirect(
      `${origin}/auth/callback?returnTo=${encodeURIComponent(returnTo)}#token=${encodeURIComponent(accessToken)}`,
    );
  }

  @Get('logout')
  async logout(
    @Query('returnTo') returnToRaw: string | undefined,
    @Res() res: Response,
  ) {
    const origin = clientOrigin(this.env.get('CORS_ORIGIN'));
    const returnTo = `${origin}${safeReturnTo(returnToRaw)}`;

    if (this.env.get('AUTH_MODE') === 'oidc') {
      const issuer = this.env.get('AUTH_ISSUER');
      if (issuer) {
        try {
          const discovery = await discoverIssuer(issuer);
          if (discovery.end_session_endpoint) {
            const endSession = new URL(discovery.end_session_endpoint);
            endSession.searchParams.set('post_logout_redirect_uri', returnTo);
            return res.redirect(endSession.toString());
          }
        } catch {
          // Fall through to a local redirect when discovery is unavailable.
        }
      }
    }

    return res.redirect(returnTo);
  }

  @Post('login')
  login(@Body() body: LoginDto) {
    const mode = this.env.get('AUTH_MODE');
    if (mode !== 'password') {
      throw new BadRequestException('Password login is disabled');
    }

    const accessToken = this.authService.login(body.email, body.password);
    if (!accessToken) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return { access_token: accessToken, expires_in: TOKEN_MAX_AGE };
  }

  private oidcCookieOptions() {
    return {
      httpOnly: true,
      secure: this.env.get('NODE_ENV') === 'production',
      sameSite: 'lax' as const,
      path: '/api/auth',
      maxAge: OIDC_COOKIE_MAX_AGE * 1000,
    };
  }

  private clearOidcCookies(res: Response) {
    const opts = { path: '/api/auth' };
    res.clearCookie(STATE_COOKIE, opts);
    res.clearCookie(VERIFIER_COOKIE, opts);
    res.clearCookie(RETURN_COOKIE, opts);
  }
}
