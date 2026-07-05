import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true })],
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('varsayılan karşılama mesajını döner', () => {
      // APP_GREETING env tanımlı değilse varsayılan "Welcome to Buzz!" döner
      expect(appController.getHello()).toBe(
        process.env.APP_GREETING ?? 'Welcome to Buzz!',
      );
    });
  });
});
