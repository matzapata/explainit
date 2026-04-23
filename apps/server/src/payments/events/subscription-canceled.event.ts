export class SubscriptionCanceled {
  public static readonly type = 'payments.subscription-canceled';

  constructor(public readonly userId: string) {}
}
