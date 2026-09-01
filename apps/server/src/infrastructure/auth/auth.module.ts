import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwksProvider } from './providers/jwks.provider';
import { NoneProvider } from './providers/none.provider';
import { PasswordProvider } from './providers/password.provider';

@Module({
  providers: [
    {
      provide: AuthService,
      useFactory: (config: ConfigService) => {
        switch (config.get<string>('AUTH_MODE', 'none')) {
          case 'oidc':
            return new JwksProvider(config);
          case 'password':
            return new PasswordProvider(config);
          default:
            return new NoneProvider(config);
        }
      },
      inject: [ConfigService],
    },
  ],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
