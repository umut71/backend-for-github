import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  DefaultValuePipe,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/permissions.decorator';

class CreateReportDto {
  reportedtype: 'user' | 'video' | 'comment';
  reason: string;
  description?: string;
  reporteduserid?: string;
  reportedvideoid?: string;
  reportedcommentid?: string;
}

class ResolveReportDto {
  action: 'approved' | 'rejected';
}

@ApiTags('reports')
@Controller('reports')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a report' })
  @ApiBody({ type: CreateReportDto })
  @ApiResponse({ status: 201, description: 'Report created successfully' })
  async createReport(@Req() req: any, @Body() dto: CreateReportDto) {
    return this.reportsService.createReport(
      req.user.id,
      dto.reportedtype,
      dto.reason,
      dto.description,
      dto.reporteduserid,
      dto.reportedvideoid,
      dto.reportedcommentid,
    );
  }

  @Get('my-reports')
  @ApiOperation({ summary: 'Get user reports' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Returns user reports' })
  async getUserReports(
    @Req() req: any,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.reportsService.getUserReports(req.user.id, page, limit);
  }

  @Get('admin/all')
  @UseGuards(PermissionsGuard)
  @RequirePermissions('system.manage', 'video.moderate')
  @ApiOperation({ summary: 'Get all reports (admin)' })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'reportedtype', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Returns all reports' })
  async getAllReports(
    @Query('status') status?: string,
    @Query('reportedtype') reportedtype?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
  ) {
    return this.reportsService.getAllReports(status, reportedtype, page, limit);
  }

  @Put('admin/:id/resolve')
  @UseGuards(PermissionsGuard)
  @RequirePermissions('system.manage', 'video.moderate')
  @ApiOperation({ summary: 'Resolve report (admin)' })
  @ApiBody({ type: ResolveReportDto })
  @ApiResponse({ status: 200, description: 'Report resolved' })
  async resolveReport(
    @Req() req: any,
    @Param('id') reportId: string,
    @Body() dto: ResolveReportDto,
  ) {
    return this.reportsService.resolveReport(
      reportId,
      req.user.id,
      dto.action,
    );
  }

  @Get('admin/stats')
  @UseGuards(PermissionsGuard)
  @RequirePermissions('system.manage', 'analytics.view')
  @ApiOperation({ summary: 'Get report stats (admin)' })
  @ApiResponse({ status: 200, description: 'Returns report statistics' })
  async getStats() {
    return this.reportsService.getReportStats();
  }
}
