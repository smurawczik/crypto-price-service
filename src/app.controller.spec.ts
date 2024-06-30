import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HttpModule } from '@nestjs/axios';
import { CacheModule } from '@nestjs/cache-manager';
import { ScheduleModule } from '@nestjs/schedule';
import { CronService } from './cron/cron.service';
import { CryptoService } from './crypto/crypto.service';

describe('AppController', () => {
  let appController: AppController;
  let appService: AppService;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      imports: [
        HttpModule,
        CacheModule.register({
          isGlobal: true,
          ttl: 60,
        }),
        ScheduleModule.forRoot(),
      ],
      controllers: [AppController],
      providers: [AppService, CronService, CryptoService],
    }).compile();

    appController = app.get<AppController>(AppController);
    appService = app.get<AppService>(AppService);
  });

  it('should return price for bitcoin', async () => {
    jest
      .spyOn(appService, 'getCryptoPrice')
      .mockImplementationOnce(() => Promise.resolve(15000));
    const priceResponse = await appController.getPriceWithInterest('bitcoin');
    expect(priceResponse).toEqual({
      formatted_price: '$15,000.00',
      interest_rate: 'N/A',
      new_price: 15000,
      original_price: 15000,
    });
  });

  it('should return price for bitcoin with interests', async () => {
    jest
      .spyOn(appService, 'getCryptoPrice')
      .mockImplementationOnce(() => Promise.resolve(15000));
    const priceResponse = await appController.getPriceWithInterest(
      'bitcoin',
      10,
    );
    expect(priceResponse).toEqual({
      formatted_price: '$16,500.00',
      interest_rate: 10,
      new_price: 16500,
      original_price: 15000,
    });
  });
});
