import { IsString, IsOptional, IsNumber, IsUUID, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateVideoDto {
  @ApiProperty({ example: 'My awesome video' })
  @IsString()
  title: string;

  @ApiProperty({ required: false, example: 'Video description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 'uuid-of-video-file' })
  @IsUUID()
  videoFileId: string;

  @ApiProperty({ required: false, example: 'uuid-of-thumbnail-file' })
  @IsOptional()
  @IsUUID()
  thumbnailFileId?: string;

  @ApiProperty({ required: false, example: 60 })
  @IsOptional()
  @IsNumber()
  duration?: number;

  @ApiProperty({ required: false, example: false, description: 'Is this video a duet?' })
  @IsOptional()
  @IsBoolean()
  isDuet?: boolean;

  @ApiProperty({ required: false, example: 'uuid-of-original-video', description: 'ID of original video for duets' })
  @IsOptional()
  @IsUUID()
  originalVideoId?: string;

  @ApiProperty({ required: false, example: 'uuid-of-sound', description: 'ID of sound/music' })
  @IsOptional()
  @IsUUID()
  soundId?: string;
}
