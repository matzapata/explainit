import { Module } from '@nestjs/common';
import { EnvService } from '@src/infra/env/env.service';
import { AuthService } from './auth.service';
import { NoneProvider } from './providers/none.provider';
import { PasswordProvider } from './providers/password.provider';

@Module({
  providers: [
    {
      provide: AuthService,
      useFactory: (env: EnvService) => {
        return env.authMode() === 'password'
          ? new PasswordProvider(env)
          : new NoneProvider(env);
      },
      inject: [EnvService],
    },
  ],
  exports: [AuthService],
})
export class AuthModule {}
