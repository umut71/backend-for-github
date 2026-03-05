import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Req,
  Query,
  DefaultValuePipe,
  ParseIntPipe,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiQuery, ApiBody } from '@nestjs/swagger';
import { GiftsService } from './gifts.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { googlePlayVerification } from '../lib/google-play-verification';

class SendGiftDto {
  receiverid: string;
  gifttypeid: string;
  videoid?: string;
}

class PurchaseCoinsDto {
  amount: number;
  paymentid?: string;
  verified?: boolean;
  productId?: string; // Google Play product ID (e.g., buzz_coins_500)
  purchaseToken?: string; // Google Play purchase token for verification
}

@ApiTags('gifts')
@Controller('gifts')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class GiftsController {
  constructor(private readonly giftsService: GiftsService) {}

  @Get('types')
  @ApiOperation({ summary: 'Get all gift types' })
  @ApiResponse({ status: 200, description: 'Returns all available gift types' })
  async getGiftTypes() {
    return this.giftsService.getGiftTypes();
  }

  @Get('balance')
  @ApiOperation({ summary: 'Get user coin balance' })
  @ApiResponse({ status: 200, description: 'Returns user coin balance' })
  async getCoinBalance(@Req() req: any) {
    return this.giftsService.getCoinBalance(req.user.userId);
  }

  @Post('purchase')
  @ApiOperation({ summary: 'Purchase coins with Google Play verification' })
  @ApiBody({ type: PurchaseCoinsDto })
  @ApiResponse({ status: 201, description: 'Coins purchased successfully' })
  async purchaseCoins(@Req() req: any, @Body() dto: PurchaseCoinsDto) {
    const logger = new Logger('GiftsController');
    
    // If productId and purchaseToken provided, verify with Google Play
    if (dto.productId && dto.purchaseToken) {
      logger.log(`Verifying Google Play purchase: ${dto.productId}`);
      
      // Verify purchase with Google Play
      const verificationResult = await googlePlayVerification.verifyProductPurchase(
        dto.productId,
        dto.purchaseToken,
      );
      
      if (!verificationResult.isValid) {
        logger.error(`Purchase verification failed: ${verificationResult.error ?? 'Unknown error'}`);
        throw new BadRequestException('Purchase verification failed');
      }
      
      // Acknowledge the purchase (required by Google Play)
      await googlePlayVerification.acknowledgePurchase(dto.productId, dto.purchaseToken);
      
      // Use orderId as paymentId to prevent double spending
      const paymentId = verificationResult.orderId ?? dto.purchaseToken;
      
      logger.log(`Purchase verified successfully: ${paymentId}`);
      
      // Call service with verified=true
      return this.giftsService.purchaseCoins(req.user.userId, dto.amount, paymentId, true);
    }
    
    // Fallback: If no Google Play token, use legacy verification
    return this.giftsService.purchaseCoins(req.user.userId, dto.amount, dto.paymentid, dto.verified ?? false);
  }

  @Post('send')
  @ApiOperation({ summary: 'Send gift to user' })
  @ApiBody({ type: SendGiftDto })
  @ApiResponse({ status: 201, description: 'Gift sent successfully' })
  async sendGift(@Req() req: any, @Body() dto: SendGiftDto) {
    return this.giftsService.sendGift(
      req.user.userId,
      dto.receiverid,
      dto.gifttypeid,
      dto.videoid,
    );
  }

  @Get('history/sent')
  @ApiOperation({ summary: 'Get sent gifts history' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Returns sent gifts history' })
  async getSentGifts(
    @Req() req: any,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.giftsService.getGiftHistory(req.user.userId, 'sent', page, limit);
  }

  @Get('history/received')
  @ApiOperation({ summary: 'Get received gifts history' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Returns received gifts history' })
  async getReceivedGifts(
    @Req() req: any,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.giftsService.getGiftHistory(req.user.userId, 'received', page, limit);
  }

  @Get('transactions')
  @ApiOperation({ summary: 'Get transaction history' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Returns transaction history' })
  async getTransactionHistory(
    @Req() req: any,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.giftsService.getTransactionHistory(req.user.userId, page, limit);
  }

  @Post('bonus')
  @ApiOperation({ summary: 'Add bonus coins from watching rewarded ad (max 5 per day)' })
  @ApiResponse({ status: 201, description: 'Bonus coins added successfully' })
  @ApiResponse({ status: 400, description: 'Daily bonus limit reached' })
  async addBonusCoins(@Req() req: any) {
    return this.giftsService.addBonusCoins(req.user.userId, 50);
  }
}
