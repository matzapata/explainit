import { Injectable } from '@nestjs/common';
import { EnvService } from '@src/infra/env/env.service';
import * as crypto from 'crypto';
import * as jwt from 'jsonwebtoken';
import { AuthService, JwtPayload } from './auth.provider';
import { payloadFromClaims } from './claims';

@Injectable()
export class PasswordProvider extends AuthService {
  constructor(private readonly env: EnvService) {
    super();
  }

  login(email: string, password: string): string | null {
    const adminEmail = this.env.get('ADMIN_EMAIL');
    const adminPassword = this.env.get('ADMIN_PASSWORD');
    const secret = this.env.get('AUTH_SECRET');

    if (!adminEmail || !adminPassword || !secret) {
      return null;
    }

    if (!safeEqual(email, adminEmail) || !safeEqual(password, adminPassword)) {
      return null;
    }

    return jwt.sign({ sub: 'local', email: adminEmail }, secret, {
      algorithm: 'HS256',
      expiresIn: '7d',
    });
  }

  async verifyToken(token: string | undefined): Promise<JwtPayload | null> {
    const secret = this.env.get('AUTH_SECRET');
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
}

function safeEqual(a: string, b: string): boolean {
  const left = crypto.createHash('sha256').update(a).digest();
  const right = crypto.createHash('sha256').update(b).digest();
  return crypto.timingSafeEqual(left, right);
}
