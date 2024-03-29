import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';

export interface JwtPayload {
  id: string;
  email: string;
}

@Injectable()
export class AuthService {
  constructor(private readonly configService: ConfigService) {}

  async verifyToken(token: string): Promise<JwtPayload | null> {
    const client = jwksClient({
      jwksUri: this.configService.get('AUTH_JWKS_URI'),
    });
    function getKey(header, callback) {
      client.getSigningKey(header.kid, function (err, key) {
        if (err) return callback(err);
        else if (!key) return callback(new Error('Key not found'));
        const signingKey = key.getPublicKey();
        callback(null, signingKey);
      });
    }

    const verify = (token: string): Promise<JwtPayload> =>
      new Promise((resolve, reject) => {
        jwt.verify(
          token,
          getKey,
          {},
          function (err, decoded: { sub: string; 'x-hasura-email': string }) {
            if (err) reject(err);
            else resolve({ id: decoded.sub, email: decoded['x-hasura-email'] });
          },
        );
      });

    try {
      return await verify(token);
    } catch (e) {
      return null;
    }
  }
}
