import {
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma.service';
import {
  generatePresignedUploadUrl,
  initiateMultipartUpload,
  getPresignedUrlForPart,
  completeMultipartUpload as s3CompleteMultipartUpload,
  getFileUrl,
  deleteFile,
} from '../lib/s3';
import { PresignedUploadDto } from './dto/presigned-upload.dto';
import { InitiateMultipartDto } from './dto/initiate-multipart.dto';
import { MultipartPartDto } from './dto/multipart-part.dto';
import { CompleteMultipartDto } from './dto/complete-multipart.dto';
import { CompleteUploadDto } from './dto/complete-upload.dto';

@Injectable()
export class UploadService {
  constructor(private prisma: PrismaService) {}

  /**
   * S3 yapılandırması yoksa 500 yerine anlamlı bir 503 hatası döndürür.
   * (Render'da AWS_BUCKET_NAME / AWS_ACCESS_KEY_ID env değişkenleri
   * ayarlanana kadar S3 upload devre dışıdır; /api/upload/local kullanın.)
   */
  private ensureS3Configured() {
    if (!process.env.AWS_BUCKET_NAME || !process.env.AWS_ACCESS_KEY_ID) {
      throw new ServiceUnavailableException(
        'Cloud storage (S3) is not configured on this server. ' +
          'Use POST /api/upload/local instead, or set AWS_* env vars.',
      );
    }
  }

  async generatePresignedUrl(dto: PresignedUploadDto) {
    this.ensureS3Configured();
    const fileId = randomUUID();
    const { uploadUrl, cloud_storage_path } = await generatePresignedUploadUrl(
      dto.fileName,
      dto.contentType,
      dto.isPublic ?? true,
    );

    return {
      uploadUrl,
      fileId,
      cloud_storage_path,
    };
  }

  async initiateMultipart(dto: InitiateMultipartDto) {
    this.ensureS3Configured();
    const fileId = randomUUID();
    const { uploadId, cloud_storage_path } = await initiateMultipartUpload(
      dto.fileName,
      dto.isPublic ?? true,
    );

    return {
      uploadId,
      fileId,
      cloud_storage_path,
    };
  }

  async getPartUploadUrl(dto: MultipartPartDto) {
    this.ensureS3Configured();
    const uploadUrl = await getPresignedUrlForPart(
      dto.cloud_storage_path,
      dto.uploadId,
      dto.partNumber,
    );

    return { uploadUrl };
  }

  async completeMultipart(dto: CompleteMultipartDto) {
    this.ensureS3Configured();
    const parts = dto.parts.map((part) => ({
      PartNumber: part.partNumber,
      ETag: part.etag,
    }));

    await s3CompleteMultipartUpload(
      dto.cloud_storage_path,
      dto.uploadId,
      parts,
    );

    return { success: true };
  }

  async completeUpload(dto: CompleteUploadDto) {
    const file = await this.prisma.file.create({
      data: {
        id: dto.fileId,
        filename: dto.fileName,
        mimetype: dto.mimeType,
        filesize: BigInt(dto.fileSize),
        cloud_storage_path: dto.cloud_storage_path,
        ispublic: dto.isPublic,
      },
    });

    const fileUrl = await getFileUrl(file.cloud_storage_path, file.ispublic);

    return {
      id: file.id,
      fileName: file.filename,
      fileUrl,
    };
  }

  async completeLocalUpload(file: any) {
    const fileUrl = `${process.env.APP_ORIGIN || 'http://localhost:3000'}/uploads/${file.filename}`;
    const fileRecord = await this.prisma.file.create({
      data: {
        filename: file.originalname,
        mimetype: file.mimetype,
        filesize: BigInt(file.size),
        cloud_storage_path: fileUrl,
        ispublic: true,
      },
    });

    return {
      id: fileRecord.id,
      fileName: fileRecord.filename,
      fileUrl,
    };
  }

  async getFileUrl(fileId: string, mode: 'view' | 'download') {
    const file = await this.prisma.file.findUnique({
      where: { id: fileId },
    });

    if (!file) {
      throw new NotFoundException('File not found');
    }

    const url = await getFileUrl(file.cloud_storage_path, file.ispublic);

    return { url };
  }

  async deleteFile(fileId: string) {
    const file = await this.prisma.file.findUnique({
      where: { id: fileId },
    });

    if (!file) {
      throw new NotFoundException('File not found');
    }

    await deleteFile(file.cloud_storage_path);
    await this.prisma.file.delete({ where: { id: fileId } });

    return { success: true };
  }
}
