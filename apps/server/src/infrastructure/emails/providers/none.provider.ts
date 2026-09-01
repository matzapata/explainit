import { Injectable } from '@nestjs/common';
import { EmailProvider } from './email.provider';

@Injectable()
export class NoneEmailProvider extends EmailProvider {
  isEnabled(): boolean {
    return false;
  }

  async sendEmail(_props: {
    to: string;
    from?: string;
    subject: string;
    text?: string;
    html?: string;
  }): Promise<void> {
    throw new Error('Email is not configured');
  }
}
