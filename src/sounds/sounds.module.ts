import { Module } from '@nestjs/common';
import { SoundsController } from './sounds.controller';
import { SoundsService } from './sounds.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SoundsController],
  providers: [SoundsService],
})
export class SoundsModule {}
