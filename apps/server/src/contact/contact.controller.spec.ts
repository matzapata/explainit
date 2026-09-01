import { ServiceUnavailableException } from '@nestjs/common';
import { TestBed } from '@automock/jest';
import { ContactController } from './contact.controller';
import { EmailService } from '@src/infrastructure/emails/email.service';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@src/users/guards/auth.guard';

describe('ContactController', () => {
  let contactController: ContactController;
  let emailService: jest.Mocked<EmailService>;
  let configService: jest.Mocked<ConfigService>;

  const user = { id: 'id', email: 'email', isAdmin: false };
  const createContactDto = { message: 'message', subject: 'subject' };

  beforeAll(() => {
    const { unit, unitRef } = TestBed.create(ContactController).compile();

    contactController = unit;
    emailService = unitRef.get(EmailService);
    configService = unitRef.get(ConfigService);
  });

  beforeEach(() => {
    jest.clearAllMocks();
    emailService.isEnabled.mockReturnValue(true);
    configService.get.mockImplementation((key: string) => {
      if (key === 'CONTACT_EMAIL') {
        return 'support@example.com';
      }
      if (key === 'RESEND_FROM_EMAIL') {
        return 'noreply@example.com';
      }
      return undefined;
    });
  });

  it('should require authentication to create a contact request', () => {
    const guards = Reflect.getMetadata('__guards__', ContactController);
    const guard = new guards[0]();

    expect(guard).toBeInstanceOf(AuthGuard);
  });

  it('should send an email from RESEND_FROM_EMAIL to CONTACT_EMAIL', async () => {
    emailService.sendEmail.mockResolvedValue();

    await contactController.create(user, createContactDto);

    expect(emailService.sendEmail).toHaveBeenCalledWith({
      from: 'noreply@example.com',
      to: 'support@example.com',
      subject: `New contact request from ${user.email}`,
      text: `Email: ${user.email}\nUID: ${user.id}\nSubject:${createContactDto.subject}\n\nMessage: ${createContactDto.message}`,
    });
  });

  it('should return "OK" after sending the email', async () => {
    emailService.sendEmail.mockResolvedValue();

    const result = await contactController.create(user, createContactDto);

    expect(result).toBe('OK');
  });

  it('should throw if the email service fails', async () => {
    emailService.sendEmail.mockRejectedValue(new Error('Failed to send email'));

    await expect(
      contactController.create(user, createContactDto),
    ).rejects.toThrow('Failed to send email');
  });

  it('should throw if CONTACT_EMAIL is not configured', async () => {
    configService.get.mockReturnValue(undefined);

    await expect(
      contactController.create(user, createContactDto),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  it('should throw if email is disabled', async () => {
    emailService.isEnabled.mockReturnValue(false);

    await expect(
      contactController.create(user, createContactDto),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
    expect(emailService.sendEmail).not.toHaveBeenCalled();
  });
});
