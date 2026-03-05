import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { StoriesService } from './stories.service';
import { CurrentUser } from '../auth/current-user.decorator';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody } from '@nestjs/swagger';

@ApiTags('stories')
@Controller('stories')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class StoriesController {
  constructor(private readonly storiesService: StoriesService) {}

  @Post('create')
  @ApiOperation({ summary: 'Create a new story (expires in 24h)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        videoFileId: { type: 'string' },
        thumbnailFileId: { type: 'string' },
      },
      required: ['videoFileId'],
    },
  })
  async createStory(
    @CurrentUser() user: any,
    @Body('videoFileId') videoFileId: string,
    @Body('thumbnailFileId') thumbnailFileId?: string,
  ) {
    return this.storiesService.createStory(user.id, videoFileId, thumbnailFileId);
  }

  @Get('active')
  @ApiOperation({ summary: 'Get all active stories from followed users' })
  async getActiveStories(@CurrentUser() user: any) {
    return this.storiesService.getActiveStories(user.id);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get specific user\'s active stories' })
  async getUserStories(@Param('userId') userId: string) {
    return this.storiesService.getUserStories(userId);
  }

  @Post('view/:storyId')
  @ApiOperation({ summary: 'Mark a story as viewed' })
  async viewStory(
    @CurrentUser() user: any,
    @Param('storyId') storyId: string,
  ) {
    await this.storiesService.viewStory(storyId, user.id);
    return { success: true };
  }

  @Get('viewers/:storyId')
  @ApiOperation({ summary: 'Get who viewed a story' })
  async getStoryViewers(@Param('storyId') storyId: string) {
    return this.storiesService.getStoryViewers(storyId);
  }

  @Delete(':storyId')
  @ApiOperation({ summary: 'Delete a story (owner only)' })
  async deleteStory(
    @CurrentUser() user: any,
    @Param('storyId') storyId: string,
  ) {
    await this.storiesService.deleteStory(storyId, user.id);
    return { success: true };
  }
}
