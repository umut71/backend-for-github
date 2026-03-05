import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UploadService } from './upload.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PresignedUploadDto } from './dto/presigned-upload.dto';
import { InitiateMultipartDto } from './dto/initiate-multipart.dto';
import { MultipartPartDto } from './dto/multipart-part.dto';
import { CompleteMultipartDto } from './dto/complete-multipart.dto';
import { CompleteUploadDto } from './dto/complete-upload.dto';

@ApiTags('File Upload')
@Controller('api/upload')
export class UploadController {
  constructor(private uploadService: UploadService) {}

  @Post('presigned')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate presigned URL for single-part upload' })
  async presignedUpload(@Body() dto: PresignedUploadDto) {
    return this.uploadService.generatePresignedUrl(dto);
  }

  @Post('multipart/initiate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Initiate multipart upload' })
  async initiateMultipart(@Body() dto: InitiateMultipartDto) {
    return this.uploadService.initiateMultipart(dto);
  }

  @Post('multipart/part')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get presigned URL for upload part' })
  async multipartPart(@Body() dto: MultipartPartDto) {
    return this.uploadService.getPartUploadUrl(dto);
  }

  @Post('multipart/complete')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Complete multipart upload' })
  async completeMultipart(@Body() dto: CompleteMultipartDto) {
    return this.uploadService.completeMultipart(dto);
  }

  @Post('complete')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Complete upload and create File record' })
  async completeUpload(@Body() dto: CompleteUploadDto) {
    return this.uploadService.completeUpload(dto);
  }


}
