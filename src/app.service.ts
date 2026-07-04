import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppService {
  constructor(private readonly configService: ConfigService) {}

  getHello(): string {
    const greeting = this.configService.get<string>(
      'APP_GREETING',
      'Welcome to Buzz!',
    );
    return greeting;
  }
}
