import { IsString, IsNotEmpty, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCommentDto {
  @ApiProperty({ description: 'Comment text', example: 'Great video!' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  text: string;
}
