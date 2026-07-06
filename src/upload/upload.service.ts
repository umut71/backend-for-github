import {
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma.service';
import {
  generatePresignedUploadUrl,
  initiateMultipartUpload,
  getPresignedUrlForPart,
  completeMultipartUpload as s3CompleteMultipartUpload,
  getFileUrl,
  headFile,
  deleteFile,
} from '../lib/s3';
import { PresignedUploadDto } from './dto/presigned-upload.dto';
import { InitiateMultipartDto } from './dto/initiate-multipart.dto';
import { MultipartPartDto } from './dto/multipart-part.dto';
import { CompleteMultipartDto } from './dto/complete-multipart.dto';
import { CompleteUploadDto } from './dto/complete-upload.dto';
import { enqueueTranscode } from '../lib/transcode-queue';

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);

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
    // Server-side dogrulama: dosya S3'te gercekten var mi ve boyutu tutuyor mu?
    // (Lokal upload'larda cloud_storage_path tam URL olur, o durumda atlanir.)
    const isS3Path =
      !dto.cloud_storage_path.startsWith('http://') &&
      !dto.cloud_storage_path.startsWith('https://');

    if (isS3Path && process.env.AWS_BUCKET_NAME) {
      let head: { contentLength?: number; etag?: string };
      try {
        head = await headFile(dto.cloud_storage_path);
      } catch {
        throw new UnprocessableEntityException(
          'Upload verification failed: file not found in cloud storage. ' +
            'Complete the upload (PUT / multipart complete) before calling /api/upload/complete.',
        );
      }

      const expectedSize = BigInt(dto.fileSize);
      if (
        head.contentLength !== undefined &&
        BigInt(head.contentLength) !== expectedSize
      ) {
        this.logger.warn(
          `Upload size mismatch for ${dto.cloud_storage_path}: expected ${expectedSize}, got ${head.contentLength}`,
        );
        throw new UnprocessableEntityException(
          `Upload verification failed: size mismatch (expected ${expectedSize} bytes, stored ${head.contentLength} bytes).`,
        );
      }
    }

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

    // Video ise arka plan transcode kuyruğuna iş yaz (HLS + thumbnail).
    // Fire-and-forget: Redis yoksa/hata olursa upload yanıtını ASLA etkilemez.
    if (isS3Path && dto.mimeType?.startsWith('video/')) {
      void enqueueTranscode({
        fileId: file.id,
        s3Key: file.cloud_storage_path,
        mimeType: dto.mimeType,
      });
    }

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
