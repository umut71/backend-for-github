import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  HttpCode,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto, LogoutDto } from './dto/refresh.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { CurrentUser } from './current-user.decorator';

@ApiTags('Authentication')
@Controller('api/auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('signup')
  @Throttle({ short: { limit: 3, ttl: 60000 } }) // 3 signups per minute
  @ApiOperation({ summary: 'User registration' })
  @ApiResponse({
    status: 201,
    description: 'The user was successfully created.',
  })
  async signup(@Body() signupDto: SignupDto) {
    return this.authService.signup(signupDto);
  }

  @Post('login')
  @Throttle({ short: { limit: 5, ttl: 60000 } }) // 5 login attempts per minute
  @ApiOperation({ summary: 'User login' })
  @ApiResponse({
    status: 200,
    description: 'The user was successfully logged in.',
  })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('refresh')
  @HttpCode(200)
  @Throttle({ short: { limit: 10, ttl: 60000 } }) // 10 refreshes per minute
  @ApiOperation({ summary: 'Rotate refresh token, get new token pair' })
  @ApiResponse({ status: 200, description: 'New access + refresh tokens.' })
  async refresh(@Body() refreshDto: RefreshDto) {
    return this.authService.refresh(refreshDto.refreshToken);
  }

  @Post('logout')
  @HttpCode(200)
  @ApiOperation({ summary: 'Revoke refresh token (logout)' })
  @ApiResponse({ status: 200, description: 'Refresh token revoked.' })
  async logout(@Body() logoutDto: LogoutDto) {
    return this.authService.logout(logoutDto.refreshToken);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user' })
  @ApiResponse({ status: 200, description: 'The current user information.' })
  async me(@CurrentUser() user: any) {
    return this.authService.me(user.id);
  }
}
