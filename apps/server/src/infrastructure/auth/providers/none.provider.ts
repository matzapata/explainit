import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthService, JwtPayload } from './auth.provider';

@Injectable()
export class NoneProvider extends AuthService {
  constructor(private readonly configService: ConfigService) {
    super();
  }

  async verifyToken(_token: string | undefined): Promise<JwtPayload | null> {
    const email =
      this.configService.get<string>('ADMIN_EMAIL') ?? 'admin@localhost';

    return { id: 'local', email };
  }
}
