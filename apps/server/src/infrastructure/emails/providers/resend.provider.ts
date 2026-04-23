import { ConfigService } from '@nestjs/config';
import { EmailProvider } from './email.provider';
import { Injectable } from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class ResendEmailProvider extends EmailProvider {
  private readonly client: Resend;

  constructor(private readonly configService: ConfigService) {
    super();

    this.client = new Resend(this.configService.get('RESEND_API_KEY'));
  }

  async sendEmail(props: {
    to: string;
    from?: string;
    subject: string;
    text?: string;
    html?: string;
  }): Promise<void> {
    if (!this.isEmailValid(props.to)) {
      throw new Error('Invalid to email');
    } else if (props.from && !this.isEmailValid(props.from)) {
      throw new Error('Invalid from email');
    }

    await this.client.emails.send({
      from: props.from ?? this.configService.get('RESEND_FROM_EMAIL'),
      to: props.to,
      subject: props.subject,
      text: props.text,
      html: props.html,
    });
  }
}
