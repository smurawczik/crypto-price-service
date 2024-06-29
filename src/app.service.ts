import { HttpService } from '@nestjs/axios';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { HttpException, Inject, Injectable, Logger } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { CronService } from './cron/cron.service';

@Injectable()
export class AppService {
  private readonly COINGECKO_API_URL =
    'https://api.coingecko.com/api/v3/simple/price';
  private readonly BITCOIN_ID = 'bitcoin';
  private readonly CURRENCY = 'usd';
  private readonly logger = new Logger(AppService.name);

  constructor(
    private readonly httpService: HttpService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private cryptoCronService: CronService,
  ) {
    const bindedFetchFunction = this.fetchAndCacheBitcoinPrice.bind(this);
    this.cryptoCronService.addCronJob('bitcoinPriceJob', bindedFetchFunction);
  }

  async fetchAndCacheBitcoinPrice() {
    try {
      const response = await firstValueFrom(
        this.httpService.get(this.COINGECKO_API_URL, {
          params: {
            ids: this.BITCOIN_ID,
            vs_currencies: this.CURRENCY,
          },
        }),
      );

      if (response.status !== 200) {
        throw new HttpException('API request failed', response.status);
      }

      const price = response.data[this.BITCOIN_ID][this.CURRENCY];
      await this.cacheManager.set('bitcoin_price', price, 6000);

      // Ajustar el intervalo del cron job basado en el número de solicitudes
      this.cryptoCronService.adjustCronInterval();

      return price;
    } catch (error) {
      this.logger.error('Failed to fetch and cache Bitcoin price', error);
    }
  }

  async getBitcoinPrice(): Promise<number> {
    this.cryptoCronService.addRequestCount();

    const cachedPrice = await this.cacheManager.get<number>('bitcoin_price');
    if (cachedPrice) {
      this.logger.debug(`returning cached price: ${cachedPrice}`);
      return cachedPrice;
    }

    const price = await this.fetchAndCacheBitcoinPrice();
    this.logger.debug(`returning fetched price: ${price}`);
    return price;
  }

  calculatePriceWithInterest(price: number, interestRate?: number): number {
    if (!interestRate) {
      return price;
    }

    return price * (1 + interestRate / 100);
  }
}
