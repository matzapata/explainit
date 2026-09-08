import { Injectable } from '@nestjs/common';
import type { EnvService } from '@src/infra/env/env.service';
import * as jwt from 'jsonwebtoken';
import jwksClient, { type JwksClient } from 'jwks-rsa';
import { AuthService, type JwtPayload } from './auth.provider';
import { payloadFromClaims } from './claims';

@Injectable()
export class JwksProvider extends AuthService {
  private readonly client: JwksClient;

  constructor(private readonly env: EnvService) {
    super();
    this.client = jwksClient({
      jwksUri: this.env.get('AUTH_JWKS_URI'),
      cache: true,
      rateLimit: true,
    });
  }

  async verifyToken(token: string | undefined): Promise<JwtPayload | null> {
    if (!token) {
      return null;
    }

    const getKey: jwt.GetPublicKeyOrSecret = (header, callback) => {
      this.client.getSigningKey(header.kid, (err, key) => {
        if (err) return callback(err);
        if (!key) return callback(new Error('Key not found'));
        callback(null, key.getPublicKey());
      });
    };

    const issuer = this.env.get('AUTH_ISSUER') || undefined;
    const audience = this.env.get('AUTH_AUDIENCE') || undefined;

    try {
      const decoded = await new Promise<jwt.JwtPayload>((resolve, reject) => {
        jwt.verify(
          token,
          getKey,
          {
            algorithms: ['RS256', 'RS384', 'RS512', 'ES256', 'ES384', 'ES512'],
            issuer,
            audience,
          },
          (err, payload) => {
            if (err) reject(err);
            else if (!payload || typeof payload === 'string') {
              reject(new Error('Invalid token payload'));
            } else resolve(payload);
          },
        );
      });

      return payloadFromClaims(decoded);
    } catch {
      return null;
    }
  }
}
