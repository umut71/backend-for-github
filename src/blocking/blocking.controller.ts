import {
  Controller,
  Post,
  Delete,
  Get,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BlockingService } from './blocking.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@ApiTags('Blocking')
@Controller('api/blocking')
export class BlockingController {
  constructor(private blockingService: BlockingService) {}

  @Post(':userId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Block user' })
  async blockUser(@CurrentUser() user: any, @Param('userId') userId: string) {
    await this.blockingService.blockUser(user.id, userId);
    return { success: true };
  }

  @Delete(':userId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Unblock user' })
  async unblockUser(@CurrentUser() user: any, @Param('userId') userId: string) {
    await this.blockingService.unblockUser(user.id, userId);
    return { success: true };
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get blocked users' })
  async getBlockedUsers(@CurrentUser() user: any) {
    return this.blockingService.getBlockedUsers(user.id);
  }
}
