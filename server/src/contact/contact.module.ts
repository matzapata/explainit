import { Module } from '@nestjs/common';
import { ContactController } from './contact.controller';
import { EmailService } from 'src/infrastructure/emails/email.service';

@Module({
  controllers: [ContactController],
  providers: [EmailService],
})
export class ContactModule {}
