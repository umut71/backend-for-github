import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { ReferralsService } from './referrals.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@ApiTags('Referrals')
@Controller('api/referrals')
export class ReferralsController {
  constructor(private referralsService: ReferralsService) {}

  @Get('code')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user referral code' })
  async getReferralCode(@CurrentUser() user: any) {
    const code = await this.referralsService.getUserReferralCode(user.id);
    return { code };
  }

  @Post('apply')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Apply referral code' })
  @ApiBody({ schema: { properties: { code: { type: 'string' } } } })
  async applyReferralCode(@CurrentUser() user: any, @Body() body: { code: string }) {
    await this.referralsService.applyReferralCode(body.code, user.id);
    return { success: true, message: '50 coins credited! Your friend will receive 100 coins.' };
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get referral stats' })
  async getReferralStats(@CurrentUser() user: any) {
    return this.referralsService.getReferralStats(user.id);
  }
}
