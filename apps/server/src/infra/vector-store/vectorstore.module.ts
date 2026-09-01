import { Module } from '@nestjs/common';
import { VectorStoreService } from './vectorstore.service';
import { PrismaModule } from '@src/infra/database/prisma.module';
import { LlmModule } from '../llm/llm.module';

@Module({
  imports: [PrismaModule, LlmModule],
  providers: [VectorStoreService],
  exports: [VectorStoreService],
})
export class VectorStoreModule {}
