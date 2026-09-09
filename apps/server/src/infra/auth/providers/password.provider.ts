import * as crypto from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { EnvService } from '@src/infra/env/env.service';
import * as jwt from 'jsonwebtoken';
import { AuthService, type JwtPayload } from './auth.provider';
import { payloadFromClaims } from './claims';

@Injectable()
export class PasswordProvider extends AuthService {
  constructor(private readonly env: EnvService) {
    super();
  }

  login(username: string, password: string): string | null {
    const adminUsername = this.env.get('HTTP_AUTH_USERNAME');
    const adminPassword = this.env.get('HTTP_AUTH_PASSWORD');
    const secret = this.jwtSecret();

    if (!adminUsername || !adminPassword || !secret) {
      return null;
    }

    if (
      !safeEqual(username, adminUsername) ||
      !safeEqual(password, adminPassword)
    ) {
      return null;
    }

    return jwt.sign({ sub: 'local', email: adminUsername }, secret, {
      algorithm: 'HS256',
      expiresIn: '7d',
    });
  }

  async verifyToken(token: string | undefined): Promise<JwtPayload | null> {
    const secret = this.jwtSecret();
    if (!token || !secret) {
      return null;
    }

    try {
      const decoded = jwt.verify(token, secret, { algorithms: ['HS256'] });
      return payloadFromClaims(decoded);
    } catch {
      return null;
    }
  }

  private jwtSecret(): string | undefined {
    const secret = this.env.get('AUTH_SECRET');
    if (secret) {
      return secret;
    }

    const password = this.env.get('HTTP_AUTH_PASSWORD');
    if (!password) {
      return undefined;
    }

    return crypto
      .createHash('sha256')
      .update(`explainit:${password}`)
      .digest('hex');
  }
}

function safeEqual(a: string, b: string): boolean {
  const left = crypto.createHash('sha256').update(a).digest();
  const right = crypto.createHash('sha256').update(b).digest();
  return crypto.timingSafeEqual(left, right);
}
