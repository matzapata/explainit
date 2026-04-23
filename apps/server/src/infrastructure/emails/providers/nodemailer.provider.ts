import { ConfigService } from '@nestjs/config';
import { EmailProvider } from './email.provider';
import * as nodemailer from 'nodemailer';
import { Injectable } from '@nestjs/common';

@Injectable()
export class NodeMailerEmailProvider extends EmailProvider {
  private readonly transporter: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {
    super();

    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: this.configService.get('NODEMAILER_EMAIL_USER'),
        pass: this.configService.get('NODEMAILER_EMAIL_PASSWORD'),
      },
    });
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

    await this.transporter.sendMail({
      ...props,
      from: props.from || this.configService.get('NODEMAILER_EMAIL_USER'),
    });
  }
}
