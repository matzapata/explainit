import { Module, ValidationPipe } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import * as Joi from 'joi';
import { ConfigModule } from '@nestjs/config';
import { APP_PIPE } from '@nestjs/core';
import { ChatModule } from './chat/chat.module';
import { ContactModule } from './contact/contact.module';
import { LoggerModule } from 'nestjs-pino';

@Module({
  imports: [
    // main controller modules
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
        AUTH_JWKS_URI: Joi.string().required(),
        ADMIN_EMAIL: Joi.string().required(),

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
