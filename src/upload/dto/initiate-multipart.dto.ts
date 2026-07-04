import {
  IsString,
  IsBoolean,
  IsOptional,
  MaxLength,
  Matches,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class InitiateMultipartDto {
  @ApiProperty({ example: 'video.mp4' })
  @IsString()
  @MaxLength(255, { message: 'File name is too long (max 255 characters)' })
  @Matches(/^[a-zA-Z0-9._-]+$/, {
    message: 'File name contains invalid characters',
  })
  fileName: string;

  @ApiProperty({ required: false, default: true })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}
