export interface SubscriptionPlan {
  name: string;
  variantId: string | null;
  interval: 'month' | 'year' | 'lifetime';
  price: number;
  description: string;
  features: string[];
  limits: {
    publish: boolean;
    resources: number;
    messagesPerDay: number;
  };
}

export const plans: { [key: string]: SubscriptionPlan } = {
  free: {
    name: 'Free',
    interval: 'lifetime',
    variantId: null,
    price: 0,
    description: 'Free plan',
    features: ['Preview page'],
    limits: {
      publish: false,
      resources: 10,
      messagesPerDay: 0,
    },
  },
  pro: {
    name: 'PRO',
    interval: 'month',
    variantId: process.env.LEMONSQUEEZY_PRO_VARIANT_ID,
    price: 9.99,
    description: 'Create sharable chats for your documentation',
    features: ['1 public chat', '1000 messages per day'],
    limits: {
      publish: true,
      resources: 100,
      messagesPerDay: 1000,
    },
  },
};
