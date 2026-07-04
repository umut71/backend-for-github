import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { BlockingController } from './blocking.controller';
import { BlockingService } from './blocking.service';

@Module({
  imports: [PrismaModule],
  controllers: [BlockingController],
  providers: [BlockingService],
})
export class BlockingModule {}
