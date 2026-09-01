import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DocumentsModule } from '@src/modules/documents/documents.module';
import { DocumentsProcessor } from '@src/modules/documents/documents.processor';
import { envSchema } from './env/env';
import { EnvModule } from './env/env.module';
import { ObservabilityModule } from './observability/observability.module';
import { QueueModule } from './queue/queue.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validate: (env) => envSchema.parse(env),
    }),
    EnvModule,
    QueueModule,
    ObservabilityModule,
    DocumentsModule,
  ],
  providers: [DocumentsProcessor],
})
export class WorkerModule {}
