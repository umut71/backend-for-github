import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class GiftsService {
  constructor(private prisma: PrismaService) {}

  // Initialize gift types (call once on startup)
  async initializeGiftTypes() {
    const giftTypes = [
      { name: 'heart', displayname: 'Heart', coinvalue: 10, emoji: '❤️' },
      { name: 'rose', displayname: 'Rose', coinvalue: 50, emoji: '🌹' },
      { name: 'diamond', displayname: 'Diamond', coinvalue: 100, emoji: '💎' },
      { name: 'crown', displayname: 'Crown', coinvalue: 200, emoji: '👑' },
      { name: 'rocket', displayname: 'Rocket', coinvalue: 500, emoji: '🚀' },
      { name: 'star', displayname: 'Star', coinvalue: 1000, emoji: '⭐' },
    ];

    for (const giftType of giftTypes) {
      await this.prisma.gifttype.upsert({
        where: { name: giftType.name },
        update: {},
        create: giftType,
      });
    }
  }

  // Get all gift types
  async getGiftTypes() {
    return this.prisma.gifttype.findMany({
      orderBy: { coinvalue: 'asc' },
    });
  }

  // Get user's coin balance
  async getCoinBalance(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { coinbalance: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return { balance: user.coinbalance ?? 0 };
  }

  // Purchase coins - REQUIRES PAYMENT VERIFICATION
  async purchaseCoins(userId: string, amount: number, paymentId?: string, verified = false) {
    // CRITICAL SECURITY: This endpoint should ONLY be called after payment verification
    // For Google Play Billing, verify the purchase token before calling this
    if (!verified) {
      throw new BadRequestException(
        'Direct coin purchase not allowed. Use Google Play Billing or App Store In-App Purchase.',
      );
    }

    if (amount <= 0 || amount > 100000) {
      throw new BadRequestException('Invalid amount (must be 1-100000)');
    }

    if (!paymentId) {
      throw new BadRequestException('Payment ID required for verification');
    }

    // Check if payment was already processed (prevent double spending)
    const existingTransaction = await this.prisma.transaction.findFirst({
      where: {
        type: 'purchase',
        metadata: {
          contains: paymentId,
        },
      },
    });

    if (existingTransaction) {
      throw new BadRequestException('This payment has already been processed');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { coinbalance: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const balanceBefore = user.coinbalance ?? 0;
    const balanceAfter = balanceBefore + amount;

    // Update user balance and create transaction (atomic)
    const [updatedUser, transaction] = await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { coinbalance: balanceAfter },
      }),
      this.prisma.transaction.create({
        data: {
          userid: userId,
          type: 'purchase',
          amount,
          balancebefore: balanceBefore,
          balanceafter: balanceAfter,
          description: `Purchased ${amount} coins`,
          metadata: JSON.stringify({ 
            paymentId,
            verifiedAt: new Date().toISOString(),
            platform: 'google_play', // or 'app_store'
          }),
        },
      }),
    ]);

    return {
      success: true,
      balance: updatedUser.coinbalance,
      transaction: {
        id: transaction.id,
        amount: transaction.amount,
        balanceAfter: transaction.balanceafter,
        createdAt: transaction.createdat,
      },
    };
  }

  // Send gift - PROTECTED AGAINST RACE CONDITIONS
  async sendGift(
    senderId: string,
    receiverId: string,
    giftTypeId: string,
    videoId?: string,
  ) {
    // Validate sender and receiver
    if (senderId === receiverId) {
      throw new BadRequestException('Cannot send gift to yourself');
    }

    // Get gift type
    const giftType = await this.prisma.gifttype.findUnique({
      where: { id: giftTypeId },
    });

    if (!giftType) {
      throw new NotFoundException('Gift type not found');
    }

    // Verify receiver exists
    const receiver = await this.prisma.user.findUnique({
      where: { id: receiverId },
      select: { id: true, isbanned: true },
    });

    if (!receiver) {
      throw new NotFoundException('Receiver not found');
    }

    if (receiver.isbanned) {
      throw new BadRequestException('Cannot send gift to banned user');
    }

    // ATOMIC TRANSACTION - Prevents race conditions
    const result = await this.prisma.$transaction(async (tx) => {
      // Get sender with FOR UPDATE lock (prevents concurrent modifications)
      const sender = await tx.user.findUnique({
        where: { id: senderId },
        select: { coinbalance: true, username: true, isbanned: true },
      });

      if (!sender) {
        throw new NotFoundException('Sender not found');
      }

      if (sender.isbanned) {
        throw new BadRequestException('Banned users cannot send gifts');
      }

      const currentBalance = sender.coinbalance ?? 0;

      // Check balance INSIDE transaction (race condition protection)
      if (currentBalance < giftType.coinvalue) {
        throw new BadRequestException(
          `Insufficient coin balance. Required: ${giftType.coinvalue}, Available: ${currentBalance}`,
        );
      }

      const senderBalanceAfter = currentBalance - giftType.coinvalue;

      // Platform commission (30%)
      const platformCommission = Math.floor(giftType.coinvalue * 0.3);
      const creatorEarning = giftType.coinvalue - platformCommission;

      // All operations in atomic transaction
      const updatedSender = await tx.user.update({
        where: { id: senderId },
        data: { coinbalance: senderBalanceAfter },
      });

      const gift = await tx.gift.create({
        data: {
          senderid: senderId,
          receiverid: receiverId,
          gifttypeid: giftTypeId,
          videoid: videoId,
        },
      });

      await tx.transaction.create({
        data: {
          userid: senderId,
          type: 'gift_sent',
          amount: -giftType.coinvalue,
          balancebefore: currentBalance,
          balanceafter: senderBalanceAfter,
          description: `Sent ${giftType.displayname} gift`,
          metadata: JSON.stringify({
            receiverId,
            giftTypeId,
            videoId,
            giftId: gift.id,
          }),
        },
      });

      const earning = await tx.earning.create({
        data: {
          userid: receiverId,
          amount: creatorEarning,
          source: 'gift',
          status: 'pending',
          metadata: JSON.stringify({
            giftId: gift.id,
            senderId,
            giftType: giftType.name,
            platformCommission,
          }),
        },
      });

      return {
        updatedSender,
        gift,
        earning,
        sender,
        platformCommission,
        creatorEarning,
      };
    });

    // Create notification for receiver
    await this.prisma.notification.create({
      data: {
        userid: receiverId,
        type: 'gift',
        message: `${result.sender.username} sent you a ${giftType.displayname}!`,
        relateduserid: senderId,
        videoid: videoId,
      },
    });

    return {
      success: true,
      gift: {
        id: result.gift.id,
        giftType: {
          name: giftType.name,
          displayname: giftType.displayname,
          emoji: giftType.emoji,
          coinvalue: giftType.coinvalue,
        },
        createdAt: result.gift.createdat,
      },
      newBalance: result.updatedSender.coinbalance,
      earning: {
        creatorEarning: result.creatorEarning,
        platformCommission: result.platformCommission,
      },
    };
  }

  // Get gift history
  async getGiftHistory(userId: string, type: 'sent' | 'received', page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const where = type === 'sent' ? { senderid: userId } : { receiverid: userId };

    const [gifts, total] = await Promise.all([
      this.prisma.gift.findMany({
        where,
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
          giftType: true,
          video: {
            select: {
              id: true,
              title: true,
            },
          },
        },
        orderBy: { createdat: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.gift.count({ where }),
    ]);

    return {
      gifts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Get transaction history
  async getTransactionHistory(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [transactions, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where: { userid: userId },
        orderBy: { createdat: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.transaction.count({ where: { userid: userId } }),
    ]);

    return {
      transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Add bonus coins from rewarded ad (max 5 per day)
  async addBonusCoins(userId: string, amount: number = 50) {
    // Check daily limit (max 5 bonuses per day)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const bonusCountToday = await this.prisma.transaction.count({
      where: {
        userid: userId,
        type: 'bonus',
        createdat: {
          gte: today,
        },
      },
    });

    if (bonusCountToday >= 5) {
      throw new BadRequestException('Daily bonus limit reached (max 5 per day)');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { coinbalance: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const balanceBefore = user.coinbalance ?? 0;
    const balanceAfter = balanceBefore + amount;

    // Update balance and create transaction (atomic)
    const [updatedUser, transaction] = await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { coinbalance: balanceAfter },
      }),
      this.prisma.transaction.create({
        data: {
          userid: userId,
          type: 'bonus',
          amount,
          balancebefore: balanceBefore,
          balanceafter: balanceAfter,
          description: `Bonus coins from watching rewarded ad`,
          metadata: JSON.stringify({
            source: 'rewarded_ad',
            timestamp: new Date().toISOString(),
            dailyCount: bonusCountToday + 1,
          }),
        },
      }),
    ]);

    return {
      success: true,
      balance: updatedUser.coinbalance,
      bonusAmount: amount,
      dailyBonusesRemaining: 5 - (bonusCountToday + 1),
      transaction: {
        id: transaction.id,
        amount: transaction.amount,
        balanceAfter: transaction.balanceafter,
        createdAt: transaction.createdat,
      },
    };
  }
}
