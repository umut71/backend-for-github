import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ChallengesService } from './challenges.service';

@ApiTags('Challenges')
@Controller('api/challenges')
export class ChallengesController {
  constructor(private challengesService: ChallengesService) {}

  @Get('active')
  @ApiOperation({ summary: 'Get active challenges' })
  async getActiveChallenges() {
    return this.challengesService.getActiveChallenges();
  }

  @Get()
  @ApiOperation({ summary: 'Get all challenges' })
  async getAllChallenges() {
    return this.challengesService.getAllChallenges();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get challenge by ID' })
  async getChallengeById(@Param('id') id: string) {
    return this.challengesService.getChallengeById(id);
  }
}
