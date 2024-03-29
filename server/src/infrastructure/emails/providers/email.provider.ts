export abstract class EmailProvider {
  abstract sendEmail(props: {
    to: string;
    from: string;
    subject: string;
    text: string;
    html: string;
  }): Promise<void>;

  protected isEmailValid(email: string): boolean {
    return /\S+@\S+\.\S+/.test(email);
  }
}
