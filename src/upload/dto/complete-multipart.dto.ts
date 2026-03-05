import { IsString, IsArray, IsNumber, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class PartDto {
  @ApiProperty({ example: 1 })
  @IsNumber()
  partNumber: number;

  @ApiProperty({ example: 'etag-string' })
  @IsString()
  etag: string;
}

export class CompleteMultipartDto {
  @ApiProperty({ example: 'uploads/123-video.mp4' })
  @IsString()
  cloud_storage_path: string;

  @ApiProperty({ example: 'upload-id-from-s3' })
  @IsString()
  uploadId: string;

  @ApiProperty({ type: [PartDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PartDto)
  parts: PartDto[];
}
