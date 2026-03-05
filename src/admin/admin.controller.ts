import {
  Controller,
  Get,
  Post,
  Delete,
  Put,
  Param,
  Body,
  Query,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiQuery, ApiBody } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/permissions.decorator';

@ApiTags('admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // Dashboard İstatistikleri
  @Get('dashboard/stats')
  @RequirePermissions('analytics.view', 'system.manage')
  @ApiOperation({ summary: 'Get dashboard statistics' })
  @ApiResponse({ status: 200, description: 'Returns dashboard stats' })
  async getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  // Kullanıcı Yönetimi
  @Get('users')
  @RequirePermissions('user.view', 'user.manage')
  @ApiOperation({ summary: 'Get all users' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Returns list of users' })
  async getAllUsers(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('search') search?: string,
  ) {
    return this.adminService.getAllUsers(page, limit, search);
  }

  @Get('users/:id')
  @RequirePermissions('user.view', 'user.manage')
  @ApiOperation({ summary: 'Get user details' })
  @ApiResponse({ status: 200, description: 'Returns user details' })
  async getUserDetail(@Param('id') userId: string) {
    return this.adminService.getUserDetail(userId);
  }

  @Put('users/:id/ban')
  @RequirePermissions('user.ban', 'user.manage')
  @ApiOperation({ summary: 'Ban a user' })
  @ApiResponse({ status: 200, description: 'User banned successfully' })
  async banUser(@Param('id') userId: string) {
    return this.adminService.banUser(userId);
  }

  @Put('users/:id/unban')
  @RequirePermissions('user.ban', 'user.manage')
  @ApiOperation({ summary: 'Unban a user' })
  @ApiResponse({ status: 200, description: 'User unbanned successfully' })
  async unbanUser(@Param('id') userId: string) {
    return this.adminService.unbanUser(userId);
  }

  @Put('users/:id/role')
  @RequirePermissions('admin.roles', 'admin.manage')
  @ApiOperation({ summary: 'Assign role to user' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        roleName: { type: 'string', example: 'admin' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Role assigned successfully' })
  async assignRole(@Param('id') userId: string, @Body('roleName') roleName: string) {
    return this.adminService.assignRole(userId, roleName);
  }

  // Rol Yönetimi
  @Get('roles')
  @RequirePermissions('admin.roles', 'admin.manage')
  @ApiOperation({ summary: 'Get all roles' })
  @ApiResponse({ status: 200, description: 'Returns list of roles with permissions' })
  async getAllRoles() {
    return this.adminService.getAllRoles();
  }

  @Get('permissions')
  @RequirePermissions('admin.roles', 'admin.manage')
  @ApiOperation({ summary: 'Get all permissions' })
  @ApiResponse({ status: 200, description: 'Returns list of permissions' })
  async getAllPermissions() {
    return this.adminService.getAllPermissions();
  }

  // Video Moderation
  @Get('videos')
  @RequirePermissions('video.view', 'video.moderate')
  @ApiOperation({ summary: 'Get all videos (admin)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Returns list of videos' })
  async getAllVideos(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('search') search?: string,
  ) {
    return this.adminService.getAllVideos(page, limit, search);
  }

  @Delete('videos/:id')
  @RequirePermissions('video.delete', 'video.moderate')
  @ApiOperation({ summary: 'Delete video (admin)' })
  @ApiResponse({ status: 200, description: 'Video deleted successfully' })
  async deleteVideo(@Param('id') videoId: string) {
    return this.adminService.deleteVideo(videoId);
  }

  // Financial Reports
  @Get('financial/reports')
  @RequirePermissions('finance.view', 'system.manage')
  @ApiOperation({ summary: 'Get financial reports' })
  @ApiResponse({ status: 200, description: 'Returns financial reports' })
  async getFinancialReports() {
    return this.adminService.getFinancialReports();
  }

  // System Analytics
  @Get('analytics/system')
  @RequirePermissions('analytics.view', 'system.manage')
  @ApiOperation({ summary: 'Get system analytics' })
  @ApiQuery({ name: 'period', required: false, enum: ['day', 'week', 'month', 'year'] })
  @ApiResponse({ status: 200, description: 'Returns system analytics' })
  async getSystemAnalytics(@Query('period') period: 'day' | 'week' | 'month' | 'year' = 'month') {
    return this.adminService.getSystemAnalytics(period);
  }

  // FRAUD DETECTION
  @Get('fraud/alerts')
  @RequirePermissions('finance.view', 'system.manage')
  @ApiOperation({ summary: 'Get fraud alerts - suspicious activities' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'riskLevel', required: false, enum: ['low', 'medium', 'high'] })
  @ApiResponse({ status: 200, description: 'Returns fraud alerts and suspicious activities' })
  async getFraudAlerts(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('riskLevel') riskLevel?: 'low' | 'medium' | 'high',
  ) {
    return this.adminService.getFraudAlerts(page, limit, riskLevel);
  }

  @Get('fraud/user/:userId')
  @RequirePermissions('finance.view', 'system.manage')
  @ApiOperation({ summary: 'Get detailed fraud report for a specific user' })
  @ApiResponse({ status: 200, description: 'Returns user fraud report with risk assessment' })
  async getUserFraudReport(@Param('userId') userId: string) {
    return this.adminService.getUserFraudReport(userId);
  }
}
