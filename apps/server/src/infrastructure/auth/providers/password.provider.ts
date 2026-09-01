import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import * as jwt from 'jsonwebtoken';
import { AuthService, JwtPayload } from './auth.provider';
import { payloadFromClaims } from './claims';

@Injectable()
export class PasswordProvider extends AuthService {
  constructor(private readonly configService: ConfigService) {
    super();
  }

  login(email: string, password: string): string | null {
    const adminEmail = this.configService.get<string>('ADMIN_EMAIL');
    const adminPassword = this.configService.get<string>('ADMIN_PASSWORD');
    const secret = this.configService.get<string>('AUTH_SECRET');

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
    const secret = this.configService.get<string>('AUTH_SECRET');
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
