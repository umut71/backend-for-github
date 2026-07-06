import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { PrismaService } from '../prisma.service';
import { LivestreamModule } from '../livestream/livestream.module';

@Module({
  imports: [
    // Canlı yayın moderasyonu (force-stop) için LivestreamService gerekir
    LivestreamModule,
  ],
  controllers: [AdminController],
  providers: [AdminService, PrismaService],
  exports: [AdminService], // Export edilen hizmeti açıkça belirtme
})
export class AdminModule {
  /**
   * Admin modülü, yönetim işlemlerini yönetmek için kullanılan servisleri ve kontrolörler içerir.
   */
}
