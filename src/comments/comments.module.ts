import { Module } from '@nestjs/common';
import { CommentsController } from './comments.controller';
import { CommentsService } from './comments.service';
import { PrismaService } from '../prisma.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    NotificationsModule,
    // Diğer gerekli modüller eklenebilir
  ],
  controllers: [CommentsController],
  providers: [
    CommentsService,
    PrismaService,
    // Diğer sağlayıcılar (eğer varsa) eklenir
  ],
  exports: [
    CommentsService,
    // Diğer servisler veya modüller (eğer varsa) dışarı aktarılır
  ],
})
export class CommentsModule {}
