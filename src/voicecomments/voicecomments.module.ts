import { Module } from '@nestjs/common';
import { VoiceCommentsController } from './voicecomments.controller';
import { VoiceCommentsService } from './voicecomments.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [VoiceCommentsController],
  providers: [VoiceCommentsService],
})
export class VoiceCommentsModule {}
