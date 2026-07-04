import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { getFileUrl } from '../lib/s3';

@Injectable()
export class StoriesService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new story (expires in 24 hours)
   */
  async createStory(
    userId: string,
    videoFileId: string,
    thumbnailFileId?: string,
  ): Promise<any> {
    // Verify files exist
    const videoFile = await this.prisma.file.findUnique({
      where: { id: videoFileId },
    });

    if (!videoFile) {
      throw new NotFoundException('Video file not found');
    }

    // Set expiration to 24 hours from now
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const story = await this.prisma.story.create({
      data: {
        userid: userId,
        videofileid: videoFileId,
        thumbnailfileid: thumbnailFileId,
        expiresat: expiresAt,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            profilepictureid: true,
          },
        },
        videoFile: true,
        thumbnailFile: true,
      },
    });

    return await this.formatStoryResponse(story);
  }

  /**
   * Get all active stories grouped by user
   */
  async getActiveStories(currentUserId: string): Promise<any[]> {
    const now = new Date();

    // Get all non-expired stories from followed users + own stories
    const following = await this.prisma.follow.findMany({
      where: { followerid: currentUserId },
      select: { followingid: true },
    });

    const followingIds = following.map((f) => f.followingid);
    const userIds = [...followingIds, currentUserId];

    const stories = await this.prisma.story.findMany({
      where: {
        userid: { in: userIds },
        expiresat: { gt: now },
      },
      orderBy: { createdat: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            profilepictureid: true,
          },
        },
        videoFile: true,
        thumbnailFile: true,
        _count: {
          select: { views: true },
        },
      },
    });

    // Group by user
    const groupedStories = new Map();
    for (const story of stories) {
      const userId = story.userid;
      if (!groupedStories.has(userId)) {
        // Check if current user has viewed any story from this user
        const hasViewed = await this.prisma.storyview.findFirst({
          where: {
            storyid: story.id,
            viewerid: currentUserId,
          },
        });

        groupedStories.set(userId, {
          user: story.user,
          stories: [],
          hasUnviewed: !hasViewed,
          storyCount: 0,
        });
      }

      const group = groupedStories.get(userId);
      group.stories.push(await this.formatStoryResponse(story));
      group.storyCount = group.stories.length;
    }

    return Array.from(groupedStories.values());
  }

  /**
   * Get specific user's active stories
   */
  async getUserStories(userId: string): Promise<any[]> {
    const now = new Date();

    const stories = await this.prisma.story.findMany({
      where: {
        userid: userId,
        expiresat: { gt: now },
      },
      orderBy: { createdat: 'asc' },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            profilepictureid: true,
          },
        },
        videoFile: true,
        thumbnailFile: true,
        _count: {
          select: { views: true },
        },
      },
    });

    return Promise.all(stories.map((s) => this.formatStoryResponse(s)));
  }

  /**
   * View a story (mark as viewed)
   */
  async viewStory(storyId: string, viewerId: string): Promise<void> {
    const story = await this.prisma.story.findUnique({
      where: { id: storyId },
    });

    if (!story) {
      throw new NotFoundException('Story not found');
    }

    // Check if already viewed
    const existingView = await this.prisma.storyview.findUnique({
      where: {
        storyid_viewerid: {
          storyid: storyId,
          viewerid: viewerId,
        },
      },
    });

    if (!existingView) {
      // Create view record
      await this.prisma.storyview.create({
        data: {
          storyid: storyId,
          viewerid: viewerId,
        },
      });

      // Increment view count
      await this.prisma.story.update({
        where: { id: storyId },
        data: { viewcount: { increment: 1 } },
      });
    }
  }

  /**
   * Get who viewed a story
   */
  async getStoryViewers(storyId: string): Promise<any[]> {
    const views = await this.prisma.storyview.findMany({
      where: { storyid: storyId },
      orderBy: { viewedat: 'desc' },
      include: {
        viewer: {
          select: {
            id: true,
            username: true,
            profilepictureid: true,
          },
        },
      },
    });

    return views.map((v) => ({
      viewer: v.viewer,
      viewedAt: v.viewedat,
    }));
  }

  /**
   * Delete expired stories (called by cron)
   */
  async deleteExpiredStories(): Promise<number> {
    const now = new Date();

    const result = await this.prisma.story.deleteMany({
      where: {
        expiresat: { lte: now },
      },
    });

    return result.count;
  }

  /**
   * Delete a specific story (only owner can delete)
   */
  async deleteStory(storyId: string, userId: string): Promise<void> {
    const story = await this.prisma.story.findUnique({
      where: { id: storyId },
    });

    if (!story) {
      throw new NotFoundException('Story not found');
    }

    if (story.userid !== userId) {
      throw new NotFoundException('You can only delete your own stories');
    }

    await this.prisma.story.delete({
      where: { id: storyId },
    });
  }

  /**
   * Format story response with file URLs
   */
  private async formatStoryResponse(story: any): Promise<any> {
    const videoUrl = story.videoFile
      ? await getFileUrl(
          story.videoFile.cloud_storage_path,
          story.videoFile.ispublic,
        )
      : null;

    const thumbnailUrl = story.thumbnailFile
      ? await getFileUrl(
          story.thumbnailFile.cloud_storage_path,
          story.thumbnailFile.ispublic,
        )
      : null;

    return {
      id: story.id,
      videoUrl,
      thumbnailUrl,
      viewCount: story.viewcount,
      createdAt: story.createdat,
      expiresAt: story.expiresat,
      user: story.user,
    };
  }
}
