import { Module } from '@nestjs/common';
import { ContactController } from './contact.controller';
import { EmailsModule } from '@src/infrastructure/emails/emails.module';

@Module({
  controllers: [ContactController],
  imports: [EmailsModule],
})
export class ContactModule {}
