import { Controller, Get, Post, Param, Body, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody, ApiQuery } from '@nestjs/swagger';
import { StoryPollsService } from './storypolls.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@ApiTags('Story Polls')
@Controller('api/storypolls')
export class StoryPollsController {
  constructor(private storyPollsService: StoryPollsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create poll for story' })
  @ApiBody({ schema: { properties: { storyId: { type: 'string' }, question: { type: 'string' }, option1: { type: 'string' }, option2: { type: 'string' } } } })
  async create(
    @Body() body: { storyId: string; question: string; option1: string; option2: string }
  ) {
    return this.storyPollsService.create(body.storyId, body.question, body.option1, body.option2);
  }

  @Post(':pollId/vote')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Vote on poll' })
  @ApiBody({ schema: { properties: { option: { type: 'number', enum: [1, 2] } } } })
  async vote(
    @Param('pollId') pollId: string,
    @CurrentUser() user: any,
    @Body() body: { option: number }
  ) {
    await this.storyPollsService.vote(pollId, user.id, body.option);
    return { success: true };
  }

  @Get('story/:storyId')
  @ApiOperation({ summary: 'Get poll for story' })
  @ApiQuery({ name: 'userId', required: false })
  async getByStory(
    @Param('storyId') storyId: string,
    @Query('userId') userId?: string
  ) {
    return this.storyPollsService.getByStory(storyId, userId);
  }
}
