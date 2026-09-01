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

        // storage (S3 / Floci / MinIO). Defaults match docker compose.
        S3_BUCKET: Joi.string().default('explainit'),
        S3_ENDPOINT: Joi.string().optional(),
        S3_PUBLIC_ENDPOINT: Joi.string().optional(),
        S3_FORCE_PATH_STYLE: Joi.boolean().optional(),
        AWS_REGION: Joi.string().default('us-east-1'),
        AWS_ACCESS_KEY_ID: Joi.string().optional(),
        AWS_SECRET_ACCESS_KEY: Joi.string().optional(),

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

        // emails — optional. Resend is used when RESEND_API_KEY is set.
        RESEND_API_KEY: Joi.string().optional().allow(''),
        RESEND_FROM_EMAIL: Joi.string().optional().allow(''),
        CONTACT_EMAIL: Joi.string().optional().allow(''),
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
