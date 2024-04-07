import { TestBed } from '@automock/jest';
import { PaymentsController } from './payments.controller';
import {
  PaymentProviders,
  PaymentsService,
  SubscriptionStatus,
  WebhookEventName,
} from '@src/infrastructure/payments/payments.service';
import { UserSubscriptionService } from './services/user-subscription.service';
import { UsersService } from '@src/users/services/users.service';
import { WebhookEventsService } from './services/webhook-events.service';
import { EmailService } from '@src/infrastructure/emails/email.service';
import { User, WebhookEvent } from '@prisma/client';
import { SubscriptionPlan, plans } from './config/plans';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AuthUser } from '@src/users/middlewares/current-user.middleware';
import { AuthGuard } from '@src/users/guards/auth.guard';

describe('PaymentsController', () => {
  // Declare the unit under test
  let paymentsController: PaymentsController;

  // Declare the mocks
  let paymentService: jest.Mocked<PaymentsService>;
  let userSubscriptionService: jest.Mocked<UserSubscriptionService>;
  let usersService: jest.Mocked<UsersService>;
  let webhookEventsService: jest.Mocked<WebhookEventsService>;
  let emailService: jest.Mocked<EmailService>;

  // utils
  const user = {
    id: '1',
    email: 'email@test.com',
  } as AuthUser;

  beforeAll(() => {
    const { unit, unitRef } = TestBed.create(PaymentsController).compile();

    // Assign the unit under test
    paymentsController = unit;

    // Retrieve mocks from the unit reference and assign
    usersService = unitRef.get(UsersService);
    paymentService = unitRef.get(PaymentsService);
    userSubscriptionService = unitRef.get(UserSubscriptionService);
    webhookEventsService = unitRef.get(WebhookEventsService);
    emailService = unitRef.get(EmailService);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getPlans', () => {
    it('should require authentication to update a user', () => {
      // Arrange
      const guards = Reflect.getMetadata(
        '__guards__',
        PaymentsController.prototype.getPlans,
      );

      // Assert
      expect(typeof guards).toBe('undefined');
    });

    it('should return the subscription plans', async () => {
      // Act
      const res = await paymentsController.getPlans();

      // Assert
      expect(res).toStrictEqual({ ...plans });
    });
  });

  describe('getSubscription', () => {
    it('should require authentication ', () => {
      // Arrange
      const guards = Reflect.getMetadata(
        '__guards__',
        PaymentsController.prototype.getSubscription,
      );
      const guard = new guards[0]();

      // Assert
      expect(guard).toBeInstanceOf(AuthGuard);
    });

    it('should return the user subscription', async () => {
      // Arrange
      const plan = {
        variantId: '1',
      } as SubscriptionPlan;
      const sub = {
        subscriptionId: '1',
        status: SubscriptionStatus.active,
      };
      userSubscriptionService.findByUserId.mockResolvedValue({
        plan,
        sub,
      } as any);

      // Act
      const res = await paymentsController.getSubscription(user);

      // Assert
      expect(res).toEqual({
        id: user.id,
        email: user.email,
        isPro: true,
        plan,
        subscription: sub,
      });
    });
  });

  describe('createSubscriptionCheckout', () => {
    it('should require authentication ', () => {
      // Arrange
      const guards = Reflect.getMetadata(
        '__guards__',
        PaymentsController.prototype.createSubscriptionCheckout,
      );
      const guard = new guards[0]();

      // Assert
      expect(guard).toBeInstanceOf(AuthGuard);
    });

    it('should create a subscription checkout', async () => {
      // Arrange
      const url = 'https://example.com';
      userSubscriptionService.findByUserId.mockResolvedValue({
        sub: null,
      } as any);
      paymentService.createSubscriptionCheckout.mockResolvedValue(url);

      // Act
      const res = await paymentsController.createSubscriptionCheckout(user);

      // Assert
      expect(res).toEqual({ url });
      expect(paymentService.createSubscriptionCheckout).toHaveBeenCalledWith(
        plans.pro.variantId,
        user.email,
        user.id,
      );
    });

    it('should throw an error if the user already has an active subscription', async () => {
      // Arrange
      userSubscriptionService.findByUserId.mockResolvedValue({
        sub: { status: SubscriptionStatus.active },
      } as any);

      // Act & Assert
      await expect(
        paymentsController.createSubscriptionCheckout(user),
      ).rejects.toThrow(
        new BadRequestException('User already has an active subscription'),
      );
    });
  });

  describe('getSubscriptionPortal', () => {
    it('should require authentication ', () => {
      // Arrange
      const guards = Reflect.getMetadata(
        '__guards__',
        PaymentsController.prototype.getSubscriptionPortal,
      );
      const guard = new guards[0]();

      // Assert
      expect(guard).toBeInstanceOf(AuthGuard);
    });

    it('should return the subscription portal URL', async () => {
      // Arrange
      const url = 'https://example.com';
      const sub = { subscriptionId: 'id', status: SubscriptionStatus.active };
      userSubscriptionService.findByUserId.mockResolvedValue({
        sub,
      } as any);
      paymentService.createSubscriptionPortal.mockResolvedValue(url);

      // Act
      const res = await paymentsController.getSubscriptionPortal(user);

      // Assert
      expect(res).toEqual({ url });
      expect(paymentService.createSubscriptionPortal).toHaveBeenCalledWith(
        sub.subscriptionId,
      );
    });

    it("should throw an error if the user doesn't have an active subscription", async () => {
      // Arrange
      userSubscriptionService.findByUserId.mockResolvedValue({
        sub: null,
      } as any);

      // Act & Assert
      await expect(
        paymentsController.getSubscriptionPortal(user),
      ).rejects.toThrow(new NotFoundException('User has no subscription'));
    });
  });

  describe('handleWebhook', () => {
    // example webhook event body
    const body = {
      data: {
        id: '331432',
        type: 'subscriptions',
        links: {
          self: 'https://api.lemonsqueezy.com/v1/subscriptions/331432',
        },
        attributes: {
          urls: {
            customer_portal:
              'https://explainit.lemonsqueezy.com/billing?expires=1712534689&test_mode=1&user=528864&signature=3c5102c9d36cf2efbec1c113ad2c73083849bbfdac2be36f48b219b7d6204332',
            update_payment_method:
              'https://explainit.lemonsqueezy.com/subscription/331432/payment-details?expires=1712599489&signature=a806060aae630eefe4666b5cb2de9c756864ce40e9bb10436726dae5b1a571ca',
            customer_portal_update_subscription:
              'https://explainit.lemonsqueezy.com/billing/331432/update?expires=1712599489&user=528864&signature=8cc6ccf31f600f697b0994bab2b0ed565db8bdb771c660f90ee30cf05a3aa770',
          },
          pause: null,
          status: 'active',
          ends_at: null,
          order_id: 2441954,
          store_id: 81205,
          cancelled: false,
          renews_at: '2024-05-07T18:04:43.000000Z',
          test_mode: true,
          user_name: 'Matías Zapata',
          card_brand: 'visa',
          created_at: '2024-04-07T18:04:44.000000Z',
          product_id: 241283,
          updated_at: '2024-04-07T18:04:48.000000Z',
          user_email: 'matuzapata@gmail.com',
          variant_id: 331617,
          customer_id: 2630490,
          product_name: 'ExplainIt PRO access',
          variant_name: 'Default',
          order_item_id: 2402675,
          trial_ends_at: null,
          billing_anchor: 7,
          card_last_four: '4242',
          status_formatted: 'Active',
          first_subscription_item: {
            id: 275708,
            price_id: 471072,
            quantity: 1,
            created_at: '2024-04-07T18:04:49.000000Z',
            updated_at: '2024-04-07T18:04:49.000000Z',
            is_usage_based: false,
            subscription_id: 331432,
          },
        },
        relationships: {
          order: {
            links: {
              self: 'https://api.lemonsqueezy.com/v1/subscriptions/331432/relationships/order',
              related:
                'https://api.lemonsqueezy.com/v1/subscriptions/331432/order',
            },
          },
          store: {
            links: {
              self: 'https://api.lemonsqueezy.com/v1/subscriptions/331432/relationships/store',
              related:
                'https://api.lemonsqueezy.com/v1/subscriptions/331432/store',
            },
          },
          product: {
            links: {
              self: 'https://api.lemonsqueezy.com/v1/subscriptions/331432/relationships/product',
              related:
                'https://api.lemonsqueezy.com/v1/subscriptions/331432/product',
            },
          },
          variant: {
            links: {
              self: 'https://api.lemonsqueezy.com/v1/subscriptions/331432/relationships/variant',
              related:
                'https://api.lemonsqueezy.com/v1/subscriptions/331432/variant',
            },
          },
          customer: {
            links: {
              self: 'https://api.lemonsqueezy.com/v1/subscriptions/331432/relationships/customer',
              related:
                'https://api.lemonsqueezy.com/v1/subscriptions/331432/customer',
            },
          },
          'order-item': {
            links: {
              self: 'https://api.lemonsqueezy.com/v1/subscriptions/331432/relationships/order-item',
              related:
                'https://api.lemonsqueezy.com/v1/subscriptions/331432/order-item',
            },
          },
          'subscription-items': {
            links: {
              self: 'https://api.lemonsqueezy.com/v1/subscriptions/331432/relationships/subscription-items',
              related:
                'https://api.lemonsqueezy.com/v1/subscriptions/331432/subscription-items',
            },
          },
          'subscription-invoices': {
            links: {
              self: 'https://api.lemonsqueezy.com/v1/subscriptions/331432/relationships/subscription-invoices',
              related:
                'https://api.lemonsqueezy.com/v1/subscriptions/331432/subscription-invoices',
            },
          },
        },
      },
      meta: {
        test_mode: true,
        event_name: 'subscription_created',
        webhook_id: '2c51e1e1-3c9d-4cfe-b8f5-94429341740c',
        custom_data: {
          user_id: 'kp_72efe4895c884b4c8c7abc8bf954b0e0',
        },
      },
    };
    // example data parsed from the webhook event
    const data = {
      id: body.data.id,
      subscriptionId: body.data.id,
      provider: PaymentProviders.lemonsqueezy,
      userId: body.meta.custom_data.user_id,
      variantId: String(body.data.attributes.variant_id),
      orderId: String(body.data.attributes.order_id),
      status: body.data.attributes.status as SubscriptionStatus,
      pauseMode: body.data.attributes.pause?.mode,
      pauseResumesAt: body.data.attributes.pause?.resumes_at,
      cancelled: body.data.attributes.cancelled,
      trialEndsAt: body.data.attributes.trial_ends_at,
      billingAnchor: body.data.attributes.billing_anchor,
      renewsAt: new Date(body.data.attributes.renews_at),
      endsAt: body.data.attributes.ends_at,
      createdAt: new Date(body.data.attributes.created_at),
      updatedAt: new Date(body.data.attributes.updated_at),
      testMode: body.data.attributes.test_mode,
      invoiceUrl: null,
    };

    it('should not require authentication ', () => {
      // Arrange
      const guards = Reflect.getMetadata(
        '__guards__',
        PaymentsController.prototype.handleWebhook,
      );

      // Assert
      expect(typeof guards).toBe('undefined');
    });

    it('should parse the data from the webhook event and create the user subscription', async () => {
      // Arrange
      paymentService.parseWebhookEvent.mockResolvedValue({
        data,
        event: body.meta.event_name as WebhookEventName,
      });
      usersService.findById.mockResolvedValue({
        id: body.meta.custom_data.user_id,
      } as User);
      webhookEventsService.create.mockResolvedValue({
        id: 1,
      } as WebhookEvent);
      paymentService.findPlanById.mockResolvedValue({
        variantId: data.variantId,
      } as any);

      // Act
      await paymentsController.handleWebhook(body);

      // Assert
      expect(paymentService.parseWebhookEvent).toHaveBeenCalled();
      expect(userSubscriptionService.upsertByUserId).toHaveBeenCalledWith(
        body.meta.custom_data.user_id,
        {
          variantId: data.variantId,
          subscriptionId: data.subscriptionId,
          provider: data.provider,
          orderId: data.orderId,
          status: data.status,
          renewsAt: data.renewsAt,
          endsAt: data.endsAt,
          trialEndsAt: data.trialEndsAt,
          billingAnchor: data.billingAnchor,
          cancelled: data.cancelled,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          pauseMode: data.pauseMode,
          pauseResumesAt: data.pauseResumesAt,
          testMode: data.testMode,
        },
      );
    });

    it('should send an email to user indicating update in subscription', async () => {
      // Arrange
      paymentService.parseWebhookEvent.mockResolvedValue({
        data,
        event: body.meta.event_name as WebhookEventName,
      });
      usersService.findById.mockResolvedValue({
        id: body.meta.custom_data.user_id,
        email: user.email,
      } as User);
      webhookEventsService.create.mockResolvedValue({
        id: 1,
      } as WebhookEvent);
      paymentService.findPlanById.mockResolvedValue({
        variantId: data.variantId,
      } as any);

      // Act
      await paymentsController.handleWebhook(body);

      // Assert
      expect(emailService.sendEmail).toHaveBeenCalledWith({
        from: 'hello@mzslabs.com',
        to: user.email,
        html: `Your subscription has been updated to ${data.status}`,
        subject: 'Subscription updated',
      });
    });

    it('should return 200 status if the user subscription is created successfully', async () => {
      // Arrange
      paymentService.parseWebhookEvent.mockResolvedValue({
        data,
        event: body.meta.event_name as WebhookEventName,
      });
      usersService.findById.mockResolvedValue({
        id: body.meta.custom_data.user_id,
      } as User);
      webhookEventsService.create.mockResolvedValue({
        id: 1,
      } as WebhookEvent);
      paymentService.findPlanById.mockResolvedValue({
        variantId: data.variantId,
      } as any);

      // Act
      const res = await paymentsController.handleWebhook(body);

      // Assert
      expect(res).toEqual('OK');
    });

    it("should throw an error if the event type is not 'subscription_created' or 'subscription_updated'", async () => {
      // Arrange
      paymentService.parseWebhookEvent.mockResolvedValue({
        data,
        event: WebhookEventName.subscription_payment_failed,
      });

      // Act & Assert
      await expect(paymentsController.handleWebhook(body)).rejects.toThrow(
        new BadRequestException('Unsupported event type'),
      );
    });

    it('should throw an error if the plan is not found', async () => {
      // Arrange
      paymentService.parseWebhookEvent.mockResolvedValue({
        data,
        event: body.meta.event_name as WebhookEventName,
      });
      usersService.findById.mockResolvedValue({
        id: body.meta.custom_data.user_id,
      } as User);
      paymentService.findPlanById.mockResolvedValue(null);

      // Act & Assert
      await expect(paymentsController.handleWebhook(body)).rejects.toThrow(
        new BadRequestException('Plan not found'),
      );
    });
  });
});
