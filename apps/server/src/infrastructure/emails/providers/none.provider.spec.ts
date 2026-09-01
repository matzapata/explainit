import { NoneEmailProvider } from './none.provider';

describe('NoneEmailProvider', () => {
  const provider = new NoneEmailProvider();

  it('is disabled', () => {
    expect(provider.isEnabled()).toBe(false);
  });

  it('rejects send attempts so mail is never silently dropped', async () => {
    await expect(
      provider.sendEmail({
        to: 'user@example.com',
        subject: 'Hello',
        text: 'Hi',
      }),
    ).rejects.toThrow('Email is not configured');
  });
});
