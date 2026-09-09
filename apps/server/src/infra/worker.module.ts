import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DocumentsModule } from '@src/modules/documents/documents.module';
import { DocumentsProcessor } from '@src/modules/documents/documents.processor';
import { envConfig } from './env/config';
import { EnvModule } from './env/env.module';
import { ObservabilityModule } from './observability/observability.module';
import { QueueModule } from './queue/queue.module';

@Module({
  imports: [
    ConfigModule.forRoot(envConfig()),
    EnvModule,
    QueueModule,
    ObservabilityModule,
    DocumentsModule,
  ],
  providers: [DocumentsProcessor],
})
export class WorkerModule {}
