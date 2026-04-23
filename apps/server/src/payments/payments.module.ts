import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { AuthService } from '@src/infrastructure/auth/auth.service';
import { UsersService } from '@src/users/services/users.service';
import { UserSubscriptionService } from './services/user-subscription.service';
import { WebhookEventsService } from './services/webhook-events.service';
import { PlanCheckerService } from './services/plan-checker.service';
import { PrismaModule } from '@src/database/prisma.module';
import { UsersModule } from '@src/users/users.module';
import { UserSubscriptionRepository } from './repositories/user-subscription.repository';
import { WebhookEventsRepository } from './repositories/webhook-events.repository';
import { EmailsModule } from '@src/infrastructure/emails/emails.module';
import { PaymentsModule as InfraPaymentsModule } from '@src/infrastructure/payments/payments.module';

@Module({
  providers: [
    AuthService,
    UsersService,
    UserSubscriptionService,
    WebhookEventsService,
    PlanCheckerService,
    UserSubscriptionRepository,
    WebhookEventsRepository,
  ],
  imports: [UsersModule, PrismaModule, EmailsModule, InfraPaymentsModule],
  controllers: [PaymentsController],
  exports: [PlanCheckerService, UserSubscriptionService],
})
export class PaymentsModule {}
