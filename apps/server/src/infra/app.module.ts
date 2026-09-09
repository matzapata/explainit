import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { envConfig } from './env/config';
import { EnvModule } from './env/env.module';
import { HttpModule } from './http/http.module';
import { ObservabilityModule } from './observability/observability.module';
import { QueueModule } from './queue/queue.module';

@Module({
  imports: [
    ConfigModule.forRoot(envConfig()),
    EnvModule,
    QueueModule,
    ObservabilityModule,
    HttpModule,
  ],
})
export class AppModule {}
