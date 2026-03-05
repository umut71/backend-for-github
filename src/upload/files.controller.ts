import {
  Controller,
  Get,
  Delete,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UploadService } from './upload.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Files')
@Controller('api/files')
export class FilesController {
  constructor(private uploadService: UploadService) {}

  @Get(':id/url')
  @ApiOperation({ summary: 'Get file URL' })
  async getFileUrl(
    @Param('id') id: string,
    @Query('mode') mode: 'view' | 'download' = 'view',
  ) {
    return this.uploadService.getFileUrl(id, mode);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete file' })
  async deleteFile(@Param('id') id: string) {
    return this.uploadService.deleteFile(id);
  }
}
