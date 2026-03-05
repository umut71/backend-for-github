import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class ChallengesService {
  constructor(private prisma: PrismaService) {}

  async getActiveChallenges() {
    const now = new Date();
    return this.prisma.challenge.findMany({
      where: {
        startdate: { lte: now },
        enddate: { gte: now },
      },
      orderBy: { enddate: 'asc' },
    });
  }

  async getAllChallenges() {
    return this.prisma.challenge.findMany({
      orderBy: { createdat: 'desc' },
    });
  }

  async getChallengeById(id: string) {
    return this.prisma.challenge.findUnique({ where: { id } });
  }
}
