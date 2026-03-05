import { Controller, Get, Post, Delete, Body, UseGuards, Req, BadRequestException, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiBody } from '@nestjs/swagger';
import { PremiumService } from './premium.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { googlePlayVerification } from '../lib/google-play-verification';

class SubscribeDto {
  plan: string;
  paymentid?: string;
  subscriptionId?: string; // Google Play subscription ID (e.g., buzz_premium_monthly)
  purchaseToken?: string; // Google Play purchase token for verification
}

@ApiTags('premium')
@Controller('premium')
export class PremiumController {
  constructor(private readonly premiumService: PremiumService) {}

  @Get('plans')
  @ApiOperation({ summary: 'Get subscription plans' })
  @ApiResponse({ status: 200, description: 'Returns all available subscription plans' })
  getPlans() {
    return this.premiumService.getPlans();
  }

  @Get('status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user subscription status' })
  @ApiResponse({ status: 200, description: 'Returns user subscription status' })
  async getStatus(@Req() req: any) {
    return this.premiumService.getSubscriptionStatus(req.user.userId);
  }

  @Post('subscribe')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Subscribe to premium plan with Google Play verification' })
  @ApiBody({ type: SubscribeDto })
  @ApiResponse({ status: 201, description: 'Subscribed successfully' })
  async subscribe(@Req() req: any, @Body() dto: SubscribeDto) {
    const logger = new Logger('PremiumController');
    
    // If subscriptionId and purchaseToken provided, verify with Google Play
    if (dto.subscriptionId && dto.purchaseToken) {
      logger.log(`Verifying Google Play subscription: ${dto.subscriptionId}`);
      
      // Verify subscription with Google Play
      const verificationResult = await googlePlayVerification.verifySubscriptionPurchase(
        dto.subscriptionId,
        dto.purchaseToken,
      );
      
      if (!verificationResult.isValid) {
        logger.error(`Subscription verification failed: ${verificationResult.error ?? 'Unknown error'}`);
        throw new BadRequestException('Subscription verification failed');
      }
      
      // Acknowledge the subscription (required by Google Play)
      await googlePlayVerification.acknowledgeSubscription(dto.subscriptionId, dto.purchaseToken);
      
      logger.log(`Subscription verified successfully, expires: ${verificationResult.expiryTime ? new Date(verificationResult.expiryTime).toISOString() : 'unknown'}`);
      
      // Use purchaseToken as paymentId
      return this.premiumService.subscribe(req.user.userId, dto.plan, dto.purchaseToken);
    }
    
    // Fallback: If no Google Play token, use legacy verification
    return this.premiumService.subscribe(req.user.userId, dto.plan, dto.paymentid);
  }

  @Delete('cancel')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancel subscription' })
  @ApiResponse({ status: 200, description: 'Subscription canceled' })
  async cancel(@Req() req: any) {
    return this.premiumService.cancelSubscription(req.user.userId);
  }

  @Get('history')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get subscription history' })
  @ApiResponse({ status: 200, description: 'Returns subscription history' })
  async getHistory(@Req() req: any) {
    return this.premiumService.getSubscriptionHistory(req.user.userId);
  }
}
