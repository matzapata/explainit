import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { AuthService } from 'src/infrastructure/auth/auth.service';
import { UsersService } from 'src/users/services/users.service';
import { PaymentsService } from '../infrastructure/payments/payments.service';
import { UserSubscriptionService } from './services/user-subscription.service';
import { WebhookEventsService } from './services/webhook-events.service';
import { EmailService } from 'src/infrastructure/emails/email.service';
import { PlanCheckerService } from './services/plan-checker.service';
import { PrismaModule } from 'src/database/prisma.module';
import { UsersModule } from 'src/users/users.module';
import { UserSubscriptionRepository } from './repositories/user-subscription.repository';
import { WebhookEventsRepository } from './repositories/webhook-events.repository';

@Module({
  providers: [
    PaymentsService,
    AuthService,
    UsersService,
    UserSubscriptionService,
    WebhookEventsService,
    EmailService,
    PlanCheckerService,
    UserSubscriptionRepository,
    WebhookEventsRepository,
  ],
  imports: [UsersModule, PrismaModule],

  controllers: [PaymentsController],
  exports: [PlanCheckerService, UserSubscriptionService],
})
export class PaymentsModule {}
