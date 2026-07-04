import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class PremiumService {
  constructor(private prisma: PrismaService) {}

  // Get subscription plans
  getPlans() {
    return [
      {
        id: 'monthly',
        name: 'Monthly Premium',
        price: 4.99,
        currency: 'USD',
        duration: 30,
        features: [
          'Ad-free experience',
          'Exclusive filters and effects',
          'Download videos',
          'Advanced analytics',
          'Premium badge',
          'Priority support',
        ],
      },
      {
        id: 'yearly',
        name: 'Yearly Premium',
        price: 39.99,
        currency: 'USD',
        duration: 365,
        discount: 33,
        features: [
          'All monthly features',
          'Save 33%',
          'Early access to new features',
        ],
      },
    ];
  }

  // Get user's subscription status
  async getSubscriptionStatus(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        ispremium: true,
        premiumexpiresat: true,
        subscriptions: {
          where: { status: 'active' },
          orderBy: { createdat: 'desc' },
          take: 1,
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const activeSubscription = user.subscriptions?.[0] ?? null;

    return {
      isPremium: user.ispremium ?? false,
      expiresAt: user.premiumexpiresat,
      subscription: activeSubscription
        ? {
            id: activeSubscription.id,
            plan: activeSubscription.plan,
            status: activeSubscription.status,
            startDate: activeSubscription.startdate,
            endDate: activeSubscription.enddate,
            autoRenew: activeSubscription.autorenew,
          }
        : null,
    };
  }

  // Subscribe to plan
  async subscribe(userId: string, plan: string, paymentId?: string) {
    const validPlans = ['monthly', 'yearly'];
    if (!validPlans.includes(plan)) {
      throw new BadRequestException('Invalid plan');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Calculate end date
    const startDate = new Date();
    const duration = plan === 'monthly' ? 30 : 365;
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + duration);

    // Create subscription and update user
    const [subscription, updatedUser] = await this.prisma.$transaction([
      this.prisma.subscription.create({
        data: {
          userid: userId,
          plan,
          status: 'active',
          startdate: startDate,
          enddate: endDate,
          autorenew: true,
          paymentid: paymentId,
        },
      }),
      this.prisma.user.update({
        where: { id: userId },
        data: {
          ispremium: true,
          premiumexpiresat: endDate,
        },
      }),
    ]);

    return {
      success: true,
      subscription: {
        id: subscription.id,
        plan: subscription.plan,
        status: subscription.status,
        startDate: subscription.startdate,
        endDate: subscription.enddate,
        autoRenew: subscription.autorenew,
      },
      message: 'Successfully subscribed to premium!',
    };
  }

  // Cancel subscription
  async cancelSubscription(userId: string) {
    const activeSubscription = await this.prisma.subscription.findFirst({
      where: {
        userid: userId,
        status: 'active',
      },
    });

    if (!activeSubscription) {
      throw new NotFoundException('No active subscription found');
    }

    // Update subscription to canceled
    await this.prisma.subscription.update({
      where: { id: activeSubscription.id },
      data: {
        status: 'canceled',
        autorenew: false,
      },
    });

    return {
      success: true,
      message:
        'Subscription canceled. Premium access will continue until the end date.',
      endDate: activeSubscription.enddate,
    };
  }

  // Renew subscription (called by cron job)
  async renewSubscription(subscriptionId: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: { user: true },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    if (!subscription.autorenew) {
      return { success: false, message: 'Auto-renew is disabled' };
    }

    // Calculate new end date
    const duration = subscription.plan === 'monthly' ? 30 : 365;
    const newStartDate = subscription.enddate;
    const newEndDate = new Date(newStartDate);
    newEndDate.setDate(newEndDate.getDate() + duration);

    // Update subscription and user
    const [updatedSubscription] = await this.prisma.$transaction([
      this.prisma.subscription.update({
        where: { id: subscriptionId },
        data: {
          startdate: newStartDate,
          enddate: newEndDate,
        },
      }),
      this.prisma.user.update({
        where: { id: subscription.userid },
        data: {
          premiumexpiresat: newEndDate,
        },
      }),
    ]);

    return {
      success: true,
      subscription: updatedSubscription,
      message: 'Subscription renewed successfully',
    };
  }

  // Check and expire subscriptions (called by cron job)
  async checkExpiredSubscriptions() {
    const now = new Date();

    // Find expired subscriptions
    const expiredSubscriptions = await this.prisma.subscription.findMany({
      where: {
        status: 'active',
        enddate: { lte: now },
      },
    });

    for (const subscription of expiredSubscriptions) {
      if (subscription.autorenew) {
        // Try to renew
        try {
          await this.renewSubscription(subscription.id);
        } catch (error) {
          // If renewal fails, expire the subscription
          await this.expireSubscription(subscription.id);
        }
      } else {
        // Expire the subscription
        await this.expireSubscription(subscription.id);
      }
    }

    return {
      processed: expiredSubscriptions.length,
      message: `Processed ${expiredSubscriptions.length} expired subscriptions`,
    };
  }

  // Expire subscription
  private async expireSubscription(subscriptionId: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id: subscriptionId },
    });

    if (!subscription) {
      return;
    }

    // Update subscription and user
    await this.prisma.$transaction([
      this.prisma.subscription.update({
        where: { id: subscriptionId },
        data: { status: 'expired' },
      }),
      this.prisma.user.update({
        where: { id: subscription.userid },
        data: {
          ispremium: false,
          premiumexpiresat: null,
        },
      }),
    ]);
  }

  // Get subscription history
  async getSubscriptionHistory(userId: string) {
    return this.prisma.subscription.findMany({
      where: { userid: userId },
      orderBy: { createdat: 'desc' },
    });
  }
}
