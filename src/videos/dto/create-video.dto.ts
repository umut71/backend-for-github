import { IsString, IsOptional, IsNumber, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateVideoDto {
  @ApiProperty({ example: 'My awesome video' })
  @IsString()
  title: string;

  @ApiProperty({ required: false, example: 'Video description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 'file-id (cuid)' })
  @IsString()
  videoFileId: string;

  @ApiProperty({ required: false, example: 'thumbnail file-id (cuid)' })
  @IsOptional()
  @IsString()
  thumbnailFileId?: string;

  @ApiProperty({ required: false, example: 60 })
  @IsOptional()
  @IsNumber()
  duration?: number;

  @ApiProperty({
    required: false,
    example: false,
    description: 'Is this video a duet?',
  })
  @IsOptional()
  @IsBoolean()
  isDuet?: boolean;

  @ApiProperty({
    required: false,
    example: 'original video file-id (cuid)',
    description: 'ID of original video for duets',
  })
  @IsOptional()
  @IsString()
  originalVideoId?: string;

  @ApiProperty({
    required: false,
    example: 'sound id (cuid)',
    description: 'ID of sound/music',
  })
  @IsOptional()
  @IsString()
  soundId?: string;
}
