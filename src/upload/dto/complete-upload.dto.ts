import { IsString, IsBoolean, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CompleteUploadDto {
  @ApiProperty({ example: 'uuid-of-file' })
  @IsUUID()
  fileId: string;

  @ApiProperty({ example: 'video.mp4' })
  @IsString()
  fileName: string;

  @ApiProperty({ example: 'video/mp4' })
  @IsString()
  mimeType: string;

  @ApiProperty({ example: 1024000 })
  @IsString()
  fileSize: string;

  @ApiProperty({ example: 'uploads/123-video.mp4' })
  @IsString()
  cloud_storage_path: string;

  @ApiProperty({ default: true })
  @IsBoolean()
  isPublic: boolean;
}
