import { Module, ValidationPipe } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import * as Joi from 'joi';
import { ConfigModule } from '@nestjs/config';
import { APP_PIPE } from '@nestjs/core';
import { ChatModule } from './chat/chat.module';
import { ContactModule } from './contact/contact.module';
import { LoggerModule } from 'nestjs-pino';
import { AuthModule } from './infrastructure/auth/auth.module';

@Module({
  imports: [
    // main controller modules
    AuthModule,
    UsersModule,
    ChatModule,
    ContactModule,
    // logger
    LoggerModule.forRoot({
      pinoHttp: {
        transport: {
          target: 'pino-pretty',
        },
      },
    }),
    // dotenv
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validationSchema: Joi.object({
        // general
        NODE_ENV: Joi.string()
          .valid('development', 'production', 'test')
          .default('production'),
        PORT: Joi.number().default(3000),

        // llm
        OPENAI_API_KEY: Joi.string().required(),

        // storage
        GCP_PROJECT_ID: Joi.string().required(),
        GCP_CLIENT_EMAIL: Joi.string().required(),
        GCP_PRIVATE_KEY: Joi.string().required(),
        GCP_STORAGE_BUCKET: Joi.string().required(),

        // auth
        AUTH_MODE: Joi.string()
          .valid('none', 'oidc', 'password')
          .default('none'),
        ADMIN_EMAIL: Joi.string().required(),
        AUTH_JWKS_URI: Joi.when('AUTH_MODE', {
          is: 'oidc',
          then: Joi.string().uri().required(),
          otherwise: Joi.string().optional(),
        }),
        AUTH_ISSUER: Joi.string().optional(),
        AUTH_AUDIENCE: Joi.string().optional(),
        AUTH_SECRET: Joi.when('AUTH_MODE', {
          is: 'password',
          then: Joi.string().min(16).required(),
          otherwise: Joi.string().optional(),
        }),
        ADMIN_PASSWORD: Joi.when('AUTH_MODE', {
          is: 'password',
          then: Joi.string().min(1).required(),
          otherwise: Joi.string().optional(),
        }),

        // database
        DATABASE_URL: Joi.string().required(),

        // emails
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
