import { Module } from '@nestjs/common';
import { ModerationService } from './moderation.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [ModerationService],
  exports: [ModerationService],
})
export class ModerationModule {}
