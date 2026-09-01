import { Module } from '@nestjs/common';
import { EnvService } from '@src/infra/env/env.service';
import { AuthService } from './auth.service';
import { JwksProvider } from './providers/jwks.provider';
import { NoneProvider } from './providers/none.provider';
import { PasswordProvider } from './providers/password.provider';

@Module({
  providers: [
    {
      provide: AuthService,
      useFactory: (env: EnvService) => {
        switch (env.get('AUTH_MODE')) {
          case 'oidc':
            return new JwksProvider(env);
          case 'password':
            return new PasswordProvider(env);
          default:
            return new NoneProvider(env);
        }
      },
      inject: [EnvService],
    },
  ],
  exports: [AuthService],
})
export class AuthModule {}
