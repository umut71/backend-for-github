import { Module } from '@nestjs/common';
import { UploadController } from './upload.controller';
import { FilesController } from './files.controller';
import { UploadService } from './upload.service';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [UploadController, FilesController],
  providers: [UploadService, PrismaService],
})
export class UploadModule {}
