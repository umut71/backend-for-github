import { IsString, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateProfileDto {
  @ApiProperty({ required: false, example: 'newusername' })
  @IsOptional()
  @IsString()
  username?: string;

  @ApiProperty({ required: false, example: 'My bio' })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiProperty({ required: false, example: 'uuid-of-profile-picture-file' })
  @IsOptional()
  @IsUUID()
  profilePictureId?: string;
}
