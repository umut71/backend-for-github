import { Module } from '@nestjs/common';
import { BlockingController } from './blocking.controller';
import { BlockingService } from './blocking.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [BlockingController],
  providers: [BlockingService],
})
export class BlockingModule {}
