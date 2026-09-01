import {
  Body,
  Controller,
  Post,
  ServiceUnavailableException,
  UseGuards,
} from '@nestjs/common';
import { EmailService } from '@src/infrastructure/emails/email.service';
import { CreateContactDto } from './dtos/contact-dto';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@src/users/guards/auth.guard';
import { CurrentUser } from '@src/users/decorators/current-user.decorator';
import { AuthUser } from '@src/users/middlewares/current-user.middleware';

@Controller('api/contact')
@UseGuards(AuthGuard)
export class ContactController {
  constructor(
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
  ) {}

  @Post('/')
  async create(
    @CurrentUser() user: AuthUser,
    @Body() createContactDto: CreateContactDto,
  ) {
    if (!this.emailService.isEnabled()) {
      throw new ServiceUnavailableException('Email is not configured');
    }

    const to = this.configService.get<string>('CONTACT_EMAIL');
    if (!to) {
      throw new ServiceUnavailableException('CONTACT_EMAIL is not configured');
    }

    const { message, subject } = createContactDto;
    await this.emailService.sendEmail({
      from: this.configService.get<string>('RESEND_FROM_EMAIL'),
      to,
      subject: `New contact request from ${user.email}`,
      text: `Email: ${user.email}\nUID: ${user.id}\nSubject:${subject}\n\nMessage: ${message}`,
    });
    return 'OK';
  }
}
