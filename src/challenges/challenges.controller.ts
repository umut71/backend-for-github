import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ChallengesService } from './challenges.service';

@ApiTags('Challenges')
@Controller('api/challenges')
export class ChallengesController {
  constructor(private readonly challengesService: ChallengesService) {}

  @Get('active')
  @ApiOperation({ summary: 'Retrieve all active challenges' })
  async getActiveChallenges() {
    return this.challengesService.getActiveChallenges();
  }

  @Get()
  @ApiOperation({ summary: 'Retrieve all challenges' })
  async getAllChallenges() {
    return this.challengesService.getAllChallenges();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retrieve a specific challenge by ID' })
  async getChallengeById(@Param('id') id: string) {
    return this.challengesService.getChallengeById(id);
  }
}
