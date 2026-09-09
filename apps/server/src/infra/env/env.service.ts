import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { authMode, type Env } from './env';

@Injectable()
export class EnvService {
  constructor(private configService: ConfigService<Env, true>) {}

  get<T extends keyof Env>(key: T) {
    return this.configService.get(key, { infer: true });
  }

  authMode() {
    return authMode({
      HTTP_AUTH_USERNAME: this.get('HTTP_AUTH_USERNAME'),
      HTTP_AUTH_PASSWORD: this.get('HTTP_AUTH_PASSWORD'),
    });
  }
}
