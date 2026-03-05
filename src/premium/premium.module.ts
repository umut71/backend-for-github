import { Module } from '@nestjs/common';
import { PremiumController } from './premium.controller';
import { PremiumService } from './premium.service';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [PremiumController],
  providers: [PremiumService, PrismaService],
  exports: [PremiumService],
})
export class PremiumModule {}
