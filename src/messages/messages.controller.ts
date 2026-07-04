import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { MessagesService } from './messages.service';
import { CurrentUser } from '../auth/current-user.decorator';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';

@ApiTags('messages')
@Controller('messages')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post('send')
  @ApiOperation({ summary: 'Send a message to another user' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        receiverId: { type: 'string' },
        content: { type: 'string' },
      },
      required: ['receiverId', 'content'],
    },
  })
  async sendMessage(
    @CurrentUser() user: any,
    @Body('receiverId') receiverId: string,
    @Body('content') content: string,
  ) {
    return this.messagesService.sendMessage(user.id, receiverId, content);
  }

  @Get('conversations')
  @ApiOperation({ summary: 'Get list of conversations (chat list)' })
  async getConversations(@CurrentUser() user: any) {
    return this.messagesService.getConversations(user.id);
  }

  @Get('conversation/:partnerId')
  @ApiOperation({ summary: 'Get conversation with a specific user' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getConversation(
    @CurrentUser() user: any,
    @Param('partnerId') partnerId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 50,
  ) {
    return this.messagesService.getConversation(
      user.id,
      partnerId,
      Number(page),
      Number(limit),
    );
  }

  @Post('read/:partnerId')
  @ApiOperation({ summary: 'Mark messages from a partner as read' })
  async markAsRead(
    @CurrentUser() user: any,
    @Param('partnerId') partnerId: string,
  ) {
    await this.messagesService.markAsRead(user.id, partnerId);
    return { success: true };
  }

  @Delete(':messageId')
  @ApiOperation({ summary: 'Delete a message' })
  async deleteMessage(
    @CurrentUser() user: any,
    @Param('messageId') messageId: string,
  ) {
    await this.messagesService.deleteMessage(messageId, user.id);
    return { success: true };
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread message count' })
  async getUnreadCount(@CurrentUser() user: any) {
    const count = await this.messagesService.getUnreadCount(user.id);
    return { count };
  }
}
