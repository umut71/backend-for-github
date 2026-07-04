import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class StoryPollsService {
  constructor(private prisma: PrismaService) {}

  async create(
    storyId: string,
    question: string,
    option1: string,
    option2: string,
  ) {
    return this.prisma.storypoll.create({
      data: {
        storyid: storyId,
        question,
        option1,
        option2,
      },
    });
  }

  async vote(pollId: string, userId: string, option: number) {
    // Check if already voted
    const existing = await this.prisma.storypollvote.findUnique({
      where: { pollid_userid: { pollid: pollId, userid: userId } },
    });

    if (existing) {
      throw new Error('Already voted');
    }

    // Create vote
    await this.prisma.storypollvote.create({
      data: {
        pollid: pollId,
        userid: userId,
        option,
      },
    });

    // Update vote count
    if (option === 1) {
      await this.prisma.storypoll.update({
        where: { id: pollId },
        data: { votes1: { increment: 1 } },
      });
    } else {
      await this.prisma.storypoll.update({
        where: { id: pollId },
        data: { votes2: { increment: 1 } },
      });
    }
  }

  async getByStory(storyId: string, userId?: string) {
    const poll = await this.prisma.storypoll.findUnique({
      where: { storyid: storyId },
      include: {
        votes: userId ? { where: { userid: userId } } : false,
      },
    });

    if (!poll) return null;

    const totalVotes = poll.votes1 + poll.votes2;
    const percentage1 =
      totalVotes > 0 ? Math.round((poll.votes1 / totalVotes) * 100) : 0;
    const percentage2 =
      totalVotes > 0 ? Math.round((poll.votes2 / totalVotes) * 100) : 0;

    return {
      ...poll,
      totalVotes,
      percentage1,
      percentage2,
      userVoted: userId ? poll.votes && poll.votes.length > 0 : false,
      userVotedOption:
        userId && poll.votes && poll.votes.length > 0
          ? poll.votes[0].option
          : null,
    };
  }
}
