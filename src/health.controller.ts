import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      message: 'Buzz API is running!',
    };
  }

  @Get('test-data')
  getTestData() {
    return {
      videos: [
        {
          id: '1',
          title: 'Test Video 1',
          description: 'This is a test',
          videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
          user: { username: 'testuser' },
          likeCount: 100,
          commentCount: 50,
        },
        {
          id: '2',
          title: 'Test Video 2',
          description: 'Another test',
          videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
          user: { username: 'testuser' },
          likeCount: 200,
          commentCount: 75,
        },
      ],
      total: 2,
    };
  }
}
