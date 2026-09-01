import { Module } from '@nestjs/common';
import { context, trace } from '@opentelemetry/api';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { LoggerModule } from 'nestjs-pino';

@Module({
  imports: [
    PrometheusModule.register({
      defaultMetrics: {
        enabled: process.env.NODE_ENV !== 'test',
      },
    }),
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
        redact: [
          'req.headers.authorization',
          'req.headers.cookie',
          'res.headers["set-cookie"]',
        ],
        customProps: () => {
          const span = trace.getSpan(context.active());
          const ctx = span?.spanContext();
          return ctx ? { traceId: ctx.traceId, spanId: ctx.spanId } : {};
        },
        ...(process.env.NODE_ENV === 'production'
          ? {}
          : { transport: { target: 'pino-pretty' } }),
      },
    }),
  ],
})
export class ObservabilityModule {}
