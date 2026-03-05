import { IsString, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class MultipartPartDto {
  @ApiProperty({ example: 'uploads/123-video.mp4' })
  @IsString()
  cloud_storage_path: string;

  @ApiProperty({ example: 'upload-id-from-s3' })
  @IsString()
  uploadId: string;

  @ApiProperty({ example: 1 })
  @IsNumber()
  partNumber: number;
}
