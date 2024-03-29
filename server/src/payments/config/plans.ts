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
    features: ['1 documents', '100 messages per day'],
    limits: {
      maxDocuments: 1,
      maxMessages: 100,
    },
  },
  pro: {
    name: 'PRO',
    interval: 'month',
    variantId: '99201',
    price: 4.99,
    description:
      'Access more documents, send more messages and keep boosting your productivity',
    features: ['10 documents per month', '1000 messages per day'],
    limits: {
      maxDocuments: 10,
      maxMessages: 1000,
    },
  },
};
