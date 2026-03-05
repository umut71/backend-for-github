import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class MessagesService {
  constructor(private prisma: PrismaService) {}

  /**
   * Send a message to another user
   */
  async sendMessage(
    senderId: string,
    receiverId: string,
    content: string,
  ): Promise<any> {
    // Check if receiver exists
    const receiver = await this.prisma.user.findUnique({
      where: { id: receiverId },
    });

    if (!receiver) {
      throw new NotFoundException('Receiver not found');
    }

    const message = await this.prisma.message.create({
      data: {
        senderid: senderId,
        receiverid: receiverId,
        content,
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            profilepictureid: true,
          },
        },
        receiver: {
          select: {
            id: true,
            username: true,
            profilepictureid: true,
          },
        },
      },
    });

    return message;
  }

  /**
   * Get conversation between two users
   */
  async getConversation(
    userId1: string,
    userId2: string,
    page: number = 1,
    limit: number = 50,
  ): Promise<any> {
    const skip = (page - 1) * limit;

    const [messages, total] = await Promise.all([
      this.prisma.message.findMany({
        where: {
          OR: [
            { senderid: userId1, receiverid: userId2 },
            { senderid: userId2, receiverid: userId1 },
          ],
        },
        orderBy: { createdat: 'desc' },
        skip,
        take: limit,
        include: {
          sender: {
            select: {
              id: true,
              username: true,
              profilepictureid: true,
            },
          },
          receiver: {
            select: {
              id: true,
              username: true,
              profilepictureid: true,
            },
          },
        },
      }),
      this.prisma.message.count({
        where: {
          OR: [
            { senderid: userId1, receiverid: userId2 },
            { senderid: userId2, receiverid: userId1 },
          ],
        },
      }),
    ]);

    // Reverse to show oldest first
    const reversedMessages = messages.reverse();

    return {
      messages: reversedMessages,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get list of conversations (chat list)
   */
  async getConversations(userId: string): Promise<any[]> {
    // Get all messages where user is sender or receiver
    const messages = await this.prisma.message.findMany({
      where: {
        OR: [{ senderid: userId }, { receiverid: userId }],
      },
      orderBy: { createdat: 'desc' },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            profilepictureid: true,
          },
        },
        receiver: {
          select: {
            id: true,
            username: true,
            profilepictureid: true,
          },
        },
      },
    });

    // Group by conversation partner
    const conversationsMap = new Map();

    for (const message of messages) {
      const partnerId =
        message.senderid === userId ? message.receiverid : message.senderid;
      const partner =
        message.senderid === userId ? message.receiver : message.sender;

      if (!conversationsMap.has(partnerId)) {
        // Count unread messages
        const unreadCount = await this.prisma.message.count({
          where: {
            senderid: partnerId,
            receiverid: userId,
            isread: false,
          },
        });

        conversationsMap.set(partnerId, {
          partnerId,
          partner,
          lastMessage: message,
          unreadCount,
        });
      }
    }

    return Array.from(conversationsMap.values());
  }

  /**
   * Mark messages as read
   */
  async markAsRead(userId: string, partnerId: string): Promise<void> {
    await this.prisma.message.updateMany({
      where: {
        senderid: partnerId,
        receiverid: userId,
        isread: false,
      },
      data: {
        isread: true,
      },
    });
  }

  /**
   * Delete a message (soft delete by clearing content)
   */
  async deleteMessage(messageId: string, userId: string): Promise<void> {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    // Only sender can delete
    if (message.senderid !== userId) {
      throw new NotFoundException('You can only delete your own messages');
    }

    await this.prisma.message.update({
      where: { id: messageId },
      data: { content: '[Message deleted]' },
    });
  }

  /**
   * Get unread message count
   */
  async getUnreadCount(userId: string): Promise<number> {
    return this.prisma.message.count({
      where: {
        receiverid: userId,
        isread: false,
      },
    });
  }
}
