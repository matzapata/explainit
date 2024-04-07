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
      resources: 0,
      messagesPerDay: 0,
    },
  },
  pro: {
    name: 'PRO',
    interval: 'month',
    variantId: '325882',
    price: 9.99,
    description: 'Create sharable chats for your documentation',
    features: ['1 public chat', '2000 messages per day'],
    limits: {
      publish: true,
      resources: 1,
      messagesPerDay: 2000,
    },
  },
};
