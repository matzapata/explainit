export enum WebhookEventName {
  subscription_created = 'subscription_created',
  subscription_updated = 'subscription_updated',
  subscription_payment_failed = 'subscription_payment_failed',
  subscription_payment_success = 'subscription_payment_success',
}

export enum SubscriptionStatus {
  on_trial = 'on_trial',
  active = 'active',
  paused = 'paused',
  past_due = 'past_due',
  unpaid = 'unpaid',
  cancelled = 'cancelled',
  expired = 'expired',
}

export enum SubscriptionInterval {
  day = 'day',
  week = 'week',
  month = 'month',
  year = 'year',
}

export interface SubscriptionPlan {
  name: string;
  productId: string;
  productName: string;
  variantId: string;
  variantName: string;
  description: string;
  price: number;
  interval: SubscriptionInterval;
  intervalCount: number;
}

export interface UserSubscription {
  productId: string;
  variantId: string;
  orderId: string;
  productName: string;
  variantName: string;
  userEmail: string;
  status: SubscriptionStatus;
  pauseMode: 'void' | 'free' | null;
  pauseResumesAt: Date | null;
  cancelled: boolean;
  billingAnchor: number;
  renewsAt: Date;
  endsAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  trialEndsAt: Date | null;
  testMode: boolean;
}

export interface WebhookEventData {
  id: string;
  subscriptionId: string;
  provider: PaymentProviders;
  userId: string;
  variantId: string;
  orderId: string;
  status: SubscriptionStatus;
  pauseMode: 'void' | 'free' | null;
  pauseResumesAt: Date;
  cancelled: boolean;
  trialEndsAt: Date;
  billingAnchor: number;
  renewsAt: Date;
  endsAt: Date;
  createdAt: Date;
  updatedAt: Date;
  testMode: boolean;
  invoiceUrl: string | null;
}

export enum PaymentProviders {
  lemonsqueezy = 'lemonsqueezy',
  // stripe = 'stripe',
}

export abstract class PaymentProvider {
  // find plan by id in the payment provider
  abstract findPlanById(variantId: string): Promise<SubscriptionPlan>;

  // find all plans available in the payment provider
  abstract findAllPlans(): Promise<SubscriptionPlan[]>;

  // find subscription by id in the payment provider
  abstract findSubscriptionById(
    subscriptionId: string,
  ): Promise<UserSubscription>;

  // create a portal url for the subscription
  abstract createSubscriptionPortal(subscription_id: string): Promise<string>;

  // create a checkout url for the subscription
  abstract createSubscriptionCheckout(
    variantId: string,
    userEmail: string,
    userId: string,
  ): Promise<string>;

  // take the event name and the subscription id from the body and fetch the subscription
  abstract parseWebhookEvent(body: { [key: string]: any }): Promise<{
    event: WebhookEventName;
    data?: WebhookEventData;
  }>;
}
