import { IsString, IsNotEmpty, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCommentDto {
  @ApiProperty({ description: 'Comment text', example: 'Awesome!' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  text: string;
}
