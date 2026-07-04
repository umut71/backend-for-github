import { Controller, Get, Header } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('/')
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('app-ads.txt')
  @Header('Content-Type', 'text/plain')
  getAppAdsTxt(): string {
    return 'google.com, pub-4929253136106656, DIRECT, f08c47fec0942fa0';
  }
}
