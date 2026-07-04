import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { PrismaService } from '../prisma.service';

@Module({
  imports: [
    // Burada diğer modüller eklenebilir (örneğin AuthModule)
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
