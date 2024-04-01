import { TestBed } from '@automock/jest';
import { ContactController } from './contact.controller';
import { EmailService } from '@src/infrastructure/emails/email.service';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@src/users/guards/auth.guard';

describe('ContactController', () => {
  // Declare the unit under test
  let contactController: ContactController;

  // Declare the mocks
  let emailService: jest.Mocked<EmailService>;
  let configService: jest.Mocked<ConfigService>;

  beforeAll(() => {
    const { unit, unitRef } = TestBed.create(ContactController).compile();

    // Assign the unit under test
    contactController = unit;

    // Retrieve mocks from the unit reference and assign
    emailService = unitRef.get(EmailService);
    configService = unitRef.get(ConfigService);
  });

  it('should require authentication to create a contact request', () => {
    // https://stackoverflow.com/questions/59767377/how-can-i-unit-test-that-a-guard-is-applied-on-a-controller-in-nestjs
    const guards = Reflect.getMetadata('__guards__', ContactController);
    const guard = new guards[0]();

    expect(guard).toBeInstanceOf(AuthGuard);
  });

  it("should send an email from 'contact@get-chatwith.com' to 'CONTACT_EMAIL' including user id, email, subject and message ", async () => {
    // Arrange
    const contactEmail = 'CONTACT_EMAIL';
    const user = { id: 'id', email: 'email' };
    const createContactDto = { message: 'message', subject: 'subject' };
    emailService.sendEmail.mockResolvedValue();
    configService.getOrThrow.mockReturnValue(contactEmail);

    // Act
    await contactController.create(user, createContactDto);

    // Assert
    expect(emailService.sendEmail).toHaveBeenCalledWith({
      from: 'contact@get-chatwith.com',
      to: contactEmail,
      subject: `New contact request from ${user.email}`,
      text: `Email: ${user.email}\nUID: ${user.id}\nSubject:${createContactDto.subject}\n\nMessage: ${createContactDto.message}`,
    });
  });

  it('should return "OK" after sending the email', async () => {
    // Arrange
    emailService.sendEmail.mockResolvedValue();
    configService.get.mockReturnValue('CONTACT_EMAIL');

    // Act
    const result = await contactController.create(
      { id: 'id', email: 'email' },
      { message: 'message', subject: 'subject' },
    );

    // Assert
    expect(result).toBe('OK');
  });

  it('should throw an error if the email service fails', async () => {
    // Arrange
    emailService.sendEmail.mockRejectedValue(new Error('Failed to send email'));
    configService.get.mockReturnValue('CONTACT_EMAIL');

    // Act
    const result = contactController.create(
      { id: 'id', email: 'email' },
      { message: 'message', subject: 'subject' },
    );

    // Assert
    await expect(result).rejects.toThrow('Failed to send email');
  });

  it('should throw an error if the contact email is not found', async () => {
    // Arrange
    emailService.sendEmail.mockResolvedValue();
    configService.getOrThrow.mockImplementation(() => {
      throw new Error('CONTACT_EMAIL not found');
    });

    // Act
    const result = contactController.create(
      { id: 'id', email: 'email' },
      { message: 'message', subject: 'subject' },
    );

    // Assert
    await expect(result).rejects.toThrow('CONTACT_EMAIL not found');
  });
});
