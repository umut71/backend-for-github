import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class ModerationService {
  private readonly logger = new Logger(ModerationService.name);

  constructor(private prisma: PrismaService) {}

  async moderateText(text: string): Promise<{ flagged: boolean; reason?: string }> {
    try {
      const response = await fetch('https://apps.abacus.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.ABACUSAI_API_KEY}`,
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: `Analyze this text for inappropriate content (hate speech, violence, adult content, spam). Respond in JSON format: {"flagged": boolean, "reason": "string if flagged"}. Text: "${text}"`,
            },
          ],
          response_format: { type: 'json_object' },
          stream: false,
        }),
      });

      const data = await response.json();
      const result = JSON.parse(data?.choices?.[0]?.message?.content ?? '{}');
      return { flagged: result.flagged ?? false, reason: result.reason };
    } catch (error: any) {
      this.logger.error('Moderation error:', error?.message);
      return { flagged: false };
    }
  }

  async flagContent(contentType: 'video' | 'comment', contentId: string, reason: string) {
    await this.prisma.report.create({
      data: {
        reporterid: 'system',
        reportedtype: contentType,
        reportedvideoid: contentType === 'video' ? contentId : undefined,
        reportedcommentid: contentType === 'comment' ? contentId : undefined,
        reason,
        status: 'pending',
      },
    });
  }
}
