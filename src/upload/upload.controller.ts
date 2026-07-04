import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname } from 'path';
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

  @Post('local')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (_req, file, cb) => {
          cb(
            null,
            `${Date.now()}-${Math.round(Math.random() * 1e9)}${extname(file.originalname)}`,
          );
        },
      }),
    }),
  )
  @ApiOperation({ summary: 'Upload file to local development storage' })
  async localUpload(@UploadedFile() file: any) {
    return this.uploadService.completeLocalUpload(file);
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
