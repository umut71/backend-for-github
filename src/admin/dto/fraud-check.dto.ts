import { ApiProperty } from '@nestjs/swagger';

export class RiskLevelDto {
  @ApiProperty({
    enum: ['low', 'medium', 'high'],
    example: 'high',
    description: 'Risk level of the fraud check',
  })
  value: 'low' | 'medium' | 'high';
}
