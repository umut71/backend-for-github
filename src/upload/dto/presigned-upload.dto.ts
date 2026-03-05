import { IsString, IsBoolean, IsOptional, IsIn, MaxLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

// Allowed file types for security
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm'];
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const ALLOWED_CONTENT_TYPES = [...ALLOWED_VIDEO_TYPES, ...ALLOWED_IMAGE_TYPES];

export class PresignedUploadDto {
  @ApiProperty({ example: 'video.mp4' })
  @IsString()
  @MaxLength(255, { message: 'File name is too long (max 255 characters)' })
  @Matches(/^[a-zA-Z0-9._-]+$/, { message: 'File name contains invalid characters' })
  fileName: string;

  @ApiProperty({ 
    example: 'video/mp4',
    description: 'Allowed: video/mp4, video/quicktime, video/webm, image/jpeg, image/png, image/gif, image/webp'
  })
  @IsString()
  @IsIn(ALLOWED_CONTENT_TYPES, { message: 'File type not allowed. Only video and image files are accepted.' })
  contentType: string;

  @ApiProperty({ required: false, default: true })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}
