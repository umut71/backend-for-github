import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class RefreshDto {
  @ApiProperty({ description: 'Refresh token issued at login/signup' })
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}

export class LogoutDto {
  @ApiPropertyOptional({ description: 'Refresh token to revoke' })
  @IsOptional()
  @IsString()
  refreshToken?: string;
}
