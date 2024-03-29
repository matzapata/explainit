import { Module, ValidationPipe } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import * as Joi from 'joi';
import { ConfigModule } from '@nestjs/config';
import { APP_PIPE } from '@nestjs/core';
import { PaymentsModule } from './payments/payments.module';
import { ChatModule } from './chat/chat.module';
import { ContactModule } from './contact/contact.module';
import { LoggerModule } from 'nestjs-pino';

@Module({
  imports: [
    // main controller modules
    UsersModule,
    PaymentsModule,
    ChatModule,
    ContactModule,
    // logger
    LoggerModule.forRoot({}),
    // dotenv
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validationSchema: Joi.object({
        NODE_ENV: Joi.string()
          .valid('development', 'production', 'test')
          .default('production'),
        PORT: Joi.number().default(3000),
        LEMONSQUEEZY_STORE_ID: Joi.string().required(),
        LEMONSQUEEZY_API_KEY: Joi.string().required(),
        LEMONSQUEEZY_WEBHOOK_SECRET: Joi.string().required(),
        LEMONSQUEEZY_REDIRECT_URL: Joi.string().required(),
        ADMIN_UID: Joi.string().required(),
        OPENAI_API_KEY: Joi.string().required(),
        GCP_PROJECT_ID: Joi.string().required(),
        GCP_CLIENT_EMAIL: Joi.string().required(),
        GCP_PRIVATE_KEY: Joi.string().required(),
        GCP_STORAGE_BUCKET: Joi.string().required(),
        AUTH_JWKS_URI: Joi.string().required(),
        DATABASE_URL: Joi.string().required(),

        // Select based on email provider
        // NODEMAILER_EMAIL_USER: Joi.string().required(),
        // NODEMAILER_EMAIL_PASSWORD: Joi.string().required(),
        RESEND_FROM_EMAIL: Joi.string().required(),
        RESEND_API_KEY: Joi.string().required(),
        CONTACT_EMAIL: Joi.string().required(),
      }),
    }),
  ],
  providers: [
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        whitelist: true,
      }),
    },
  ],
})
export class AppModule {}
