import { Injectable } from '@nestjs/common';
import { EnvService } from '@src/infra/env/env.service';
import { AuthService, type JwtPayload } from './auth.provider';

@Injectable()
export class NoneProvider extends AuthService {
  constructor(private readonly env: EnvService) {
    super();
  }

  async verifyToken(_token: string | undefined): Promise<JwtPayload | null> {
    const email = this.env.get('HTTP_AUTH_USERNAME') ?? 'admin@localhost';

    return { id: 'local', email };
  }
}
