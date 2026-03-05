import { Module } from '@nestjs/common';
import { StoryPollsController } from './storypolls.controller';
import { StoryPollsService } from './storypolls.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [StoryPollsController],
  providers: [StoryPollsService],
})
export class StoryPollsModule {}
