import {
  Controller,
  Post,
  Delete,
  Get,
  Param,
  Query,
  UseGuards,
  Request,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { FollowsService } from './follows.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('follows')
@Controller('api/users')
export class FollowsController {
  constructor(private readonly followsService: FollowsService) {}

  @Post(':id/follow')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Follow a user' })
  @ApiResponse({ status: 201, description: 'User followed successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 409, description: 'Already following this user' })
  async followUser(@Param('id') followingId: string, @Request() req: any) {
    return this.followsService.followUser(req.user.id, followingId);
  }

  @Delete(':id/unfollow')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Unfollow a user' })
  @ApiResponse({ status: 200, description: 'User unfollowed successfully' })
  @ApiResponse({ status: 404, description: 'Follow relationship not found' })
  async unfollowUser(@Param('id') followingId: string, @Request() req: any) {
    return this.followsService.unfollowUser(req.user.id, followingId);
  }

  @Get(':id/is-following')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Check if current user is following the specified user',
  })
  @ApiResponse({ status: 200, description: 'Returns follow status' })
  async isFollowing(@Param('id') followingId: string, @Request() req: any) {
    const isFollowing = await this.followsService.isFollowing(
      req.user.id,
      followingId,
    );
    return { isFollowing };
  }

  @Get(':id/followers')
  @ApiOperation({ summary: "Get user's followers" })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Returns list of followers' })
  async getFollowers(
    @Param('id') userId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.followsService.getFollowers(userId, page, limit);
  }

  @Get(':id/following')
  @ApiOperation({ summary: 'Get users that this user is following' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Returns list of following' })
  async getFollowing(
    @Param('id') userId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.followsService.getFollowing(userId, page, limit);
  }

  @Get(':id/follow-counts')
  @ApiOperation({ summary: 'Get follower and following counts' })
  @ApiResponse({
    status: 200,
    description: 'Returns follower and following counts',
  })
  async getFollowCounts(@Param('id') userId: string) {
    return this.followsService.getFollowCounts(userId);
  }
}
