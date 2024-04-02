export interface SubscriptionPlan {
  name: string;
  variantId: string | null;
  interval: 'month' | 'year' | 'lifetime';
  price: number;
  description: string;
  features: string[];
  limits: {
    maxDocuments: number;
    maxMessages: number;
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
      maxDocuments: 1,
      maxMessages: 100,
    },
  },
  pro: {
    name: 'PRO',
    interval: 'month',
    variantId: '325882',
    price: 9.99,
    description: 'Create sharable chats for your documentation',
    features: ['10 documents per month', '1000 messages per day'],
    limits: {
      maxDocuments: 10,
      maxMessages: 1000,
    },
  },
};
