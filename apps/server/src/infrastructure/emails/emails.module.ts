import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmailService } from './email.service';
import { NoneEmailProvider } from './providers/none.provider';
import { ResendEmailProvider } from './providers/resend.provider';

@Module({
  providers: [
    {
      provide: EmailService,
      useFactory: (config: ConfigService) => {
        if (config.get<string>('RESEND_API_KEY')) {
          return new ResendEmailProvider(config);
        }
        return new NoneEmailProvider();
      },
      inject: [ConfigService],
    },
  ],
  exports: [EmailService],
})
export class EmailsModule {}
