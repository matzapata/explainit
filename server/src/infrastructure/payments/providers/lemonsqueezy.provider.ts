import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import {
  PaymentProvider,
  PaymentProviders,
  SubscriptionInterval,
  SubscriptionPlan,
  SubscriptionStatus,
  UserSubscription,
  WebhookEventData,
  WebhookEventName,
} from './payment.provider';

interface PaginationObject {
  currentPage: number;
  from: number;
  lastPage: number;
  perPage: number;
  to: number;
  total: number;
}

interface VariantObject {
  type: 'variants';
  id: string;
  attributes: {
    price: string;
    is_subscription: boolean;
    interval: SubscriptionInterval;
    interval_count: number;
    has_free_trial: boolean;
    trial_interval: SubscriptionInterval;
    trial_interval_count: number;
    pay_what_you_want: boolean;
    min_price: number;
    suggested_price: number;
    product_id: number;
    name: string;
    slug: string;
    description: string | null;
    has_license_keys: boolean;
    license_activation_limit: number;
    is_license_limit_unlimited: boolean;
    license_length_value: number;
    license_length_unit: string;
    is_license_length_unlimited: boolean;
    sort: number;
    status: 'published' | 'draft' | 'pending';
    status_formatted: string;
    created_at: string;
    updated_at: string;
    test_mode: boolean;
  };
}

interface ProductObject {
  type: 'products';
  id: string;
  attributes: {
    store_id: number;
    name: string;
    slug: string;
    description: string | null;
    status: 'published' | 'draft';
    status_formatted: string;
    thumb_url: string | null;
    large_thumb_url: string | null;
    price: number;
    price_formatted: string;
    from_price: number | null;
    to_price: number | null;
    pay_what_you_want: boolean;
    buy_now_url: string;
    created_at: string;
    updated_at: string;
    test_mode: boolean;
  };
}

interface SubscriptionObject {
  type: 'subscriptions';
  id: string;
  attributes: {
    store_id: number;
    customer_id: number;
    order_id: number;
    order_item_id: number;
    product_id: number;
    variant_id: number;
    product_name: string;
    variant_name: string;
    user_name: string;
    user_email: string;
    status: SubscriptionStatus;
    status_formatted: string;
    card_brand: string | null;
    card_last_four: string | null;
    pause: { mode: 'void' | 'free'; resumes_at: string } | null;
    cancelled: boolean;
    trial_ends_at: Date | null;
    billing_anchor: number;
    first_subscription_item: {
      id: number;
      subscription_id: number;
      price_id: number;
      quantity: number;
      created_at: string;
      updated_at: string;
    } | null;
    urls: {
      update_payment_method: string;
      customer_portal: string;
      customer_portal_update_subscription: string;
    };
    renews_at: string;
    ends_at: string | null;
    created_at: string;
    updated_at: string;
    test_mode: boolean;
  };
}

@Injectable()
export class LemonSqueezyPaymentProvider implements PaymentProvider {
  private readonly client: AxiosInstance;
  private readonly storeId: string;
  private readonly redirectUrl: string;
  private readonly apiKey: string;
  private readonly name: PaymentProviders = PaymentProviders.lemonsqueezy;

  constructor(private readonly configService: ConfigService) {
    // Setup of variables
    this.storeId = this.configService.get<string>('LEMONSQUEEZY_STORE_ID');
    this.redirectUrl = this.configService.get<string>(
      'LEMONSQUEEZY_REDIRECT_URL',
    );
    this.apiKey = this.configService.get<string>('LEMONSQUEEZY_API_KEY');

    // Create client
    this.client = axios.create({
      baseURL: 'https://api.lemonsqueezy.com/v1',
      timeout: 1000,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
      },
    });
  }

  async createSubscriptionCheckout(
    variant_id: string,
    user_email: string,
    user_id: string,
  ): Promise<string> {
    const res = await this.client.post('/checkouts', {
      data: {
        type: 'checkouts',
        attributes: {
          product_options: {
            enabled_variants: [variant_id], // Only show the selected variant in the checkout
            redirect_url: this.redirectUrl,
            receipt_button_text: 'Go to your account',
            receipt_thank_you_note: 'Thank you for signing up!',
          },
          checkout_data: {
            email: user_email, // Displays in the checkout form
            custom: {
              user_id: user_id, // Sent in the background; visible in webhooks and API calls
            },
          },
        },
        relationships: {
          store: {
            data: {
              type: 'stores',
              id: this.storeId,
            },
          },
          variant: {
            data: {
              type: 'variants',
              id: variant_id,
            },
          },
        },
      },
    });

    return res.data.data.attributes.url;
  }

  async findAllPlans(): Promise<SubscriptionPlan[]> {
    let page = 1;
    const pageSize = 50;
    const plans: SubscriptionPlan[] = [];

    while (true) {
      const res = await this.listVariants(page, pageSize);
      plans.push(
        ...res.data
          .filter(
            (v) =>
              v.attributes.is_subscription &&
              v.attributes.status === 'published',
          )
          .map((v) => {
            const product = res.included.find(
              (p) => p.id === String(v.attributes.product_id),
            );
            return {
              name: product?.attributes.name,
              productId: String(v.attributes.product_id),
              variantId: v.id,
              description: v.attributes.description.replace(/<[^>]*>?/gm, ''),
              variantName: v.attributes.name,
              price: Number(v.attributes.price),
              interval: v.attributes.interval,
              intervalCount: v.attributes.interval_count,
              productName: product?.attributes.name,
            };
          }),
      );
      if (res.meta.page.currentPage === res.meta.page.lastPage) {
        break;
      } else page++;
    }

    return plans;
  }

  async findPlanById(variant_id: string): Promise<SubscriptionPlan> {
    const res = await this.client.get(
      `/variants/${variant_id}?include=product`,
    );
    const attributes = res.data.data.attributes;

    return {
      name: attributes.name,
      productId: attributes.product_id,
      productName: res.data.included[0].attributes.name,
      variantId: res.data.data.id,
      variantName: attributes.name,
      description: attributes.description.replace(/<[^>]*>?/gm, ''),
      price: Number(attributes.price),
      interval: attributes.interval,
      intervalCount: attributes.interval_count,
    };
  }

  async findSubscriptionById(
    subscription_id: string,
  ): Promise<UserSubscription> {
    const res = await this.client.get(`/subscriptions/${subscription_id}`);
    const subscription = res.data.data as SubscriptionObject;
    return {
      productId: String(subscription.attributes.product_id),
      variantId: String(subscription.attributes.variant_id),
      orderId: String(subscription.attributes.order_id),
      productName: subscription.attributes.product_name,
      variantName: subscription.attributes.variant_name,
      userEmail: subscription.attributes.user_email,
      status: subscription.attributes.status,
      pauseMode: subscription.attributes.pause?.mode,
      pauseResumesAt: subscription.attributes.pause?.resumes_at
        ? new Date(subscription.attributes.pause?.resumes_at)
        : null,
      cancelled: subscription.attributes.cancelled,
      billingAnchor: subscription.attributes.billing_anchor,
      renewsAt: new Date(subscription.attributes.renews_at),
      endsAt: new Date(subscription.attributes.ends_at),
      createdAt: new Date(subscription.attributes.created_at),
      updatedAt: new Date(subscription.attributes.updated_at),
      trialEndsAt: subscription.attributes.trial_ends_at
        ? new Date(subscription.attributes.trial_ends_at)
        : null,
      testMode: subscription.attributes.test_mode,
    };
  }

  async createSubscriptionPortal(subscriptionId: string): Promise<string> {
    const res = await this.client.get(`/subscriptions/${subscriptionId}`);
    return res.data.data.attributes.urls.customer_portal;
  }

  async parseWebhookEvent(body: { [key: string]: any }): Promise<{
    event: WebhookEventName;
    data: WebhookEventData;
  }> {
    let event: WebhookEventName;
    let data: WebhookEventData | undefined;

    switch (body.meta.event_name) {
      case 'subscription_created':
      case 'subscription_updated': {
        event = WebhookEventName.subscription_created;
        const subscriptionId = body.data.id;
        const subscription = await this.findSubscriptionById(subscriptionId);

        data = {
          id: body.data.id,
          subscriptionId: body.data.id,
          provider: this.name,
          userId: body.meta.custom_data.user_id,
          variantId: subscription.variantId,
          orderId: subscription.orderId,
          status: subscription.status,
          pauseMode: subscription.pauseMode,
          pauseResumesAt: subscription.pauseResumesAt,
          cancelled: subscription.cancelled,
          trialEndsAt: subscription.trialEndsAt,
          billingAnchor: subscription.billingAnchor,
          renewsAt: subscription.renewsAt,
          endsAt: subscription.endsAt,
          createdAt: subscription.createdAt,
          updatedAt: subscription.updatedAt,
          testMode: subscription.testMode,
          invoiceUrl: null,
        };
        break;
      }
      default: {
        throw new Error('Unhandled event');
      }
    }

    return {
      event: event,
      data: data,
    };
  }

  // Private utils
  private async listVariants(
    page?: number,
    size?: number,
  ): Promise<{
    meta: { page: PaginationObject };
    data: VariantObject[];
    included: ProductObject[];
  }> {
    const query = page ? `&page[number]=${page}&page[size]=${size}` : '';
    const res = await this.client.get('/variants?include=product' + query);
    return res.data;
  }
}
