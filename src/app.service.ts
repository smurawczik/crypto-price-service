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
  ) {}

  async fetchAndCacheBitcoinPrice(coinId: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.get(this.COINGECKO_API_URL, {
          params: {
            ids: coinId,
            vs_currencies: this.CURRENCY,
          },
        }),
      );
      this.logger.debug(`fetching crypto price for ${coinId}`);

      if (response.status !== 200) {
        throw new HttpException('API request failed', response.status);
      }

      const price = response.data[coinId][this.CURRENCY];
      await this.cacheManager.set(this.getCacheKey(coinId), price, 6000);

      // Ajustar el intervalo del cron job basado en el número de solicitudes
      this.cryptoCronService.adjustCronInterval(this.getCronkey(coinId));

      return price;
    } catch (error) {
      this.logger.error('Failed to fetch and cache Bitcoin price', error);
    }
  }

  async getCryptoPrice(coinId: string): Promise<number> {
    // lets create the cron job if it does not exist
    if (!this.cryptoCronService.doesCronExist(this.getCronkey(coinId))) {
      const bindedFetchFunction = this.fetchAndCacheBitcoinPrice.bind(
        this,
        coinId,
      );
      this.cryptoCronService.addCronJobIfNotExists(
        this.getCronkey(coinId),
        bindedFetchFunction,
      );
    }

    this.cryptoCronService.addRequestCount(this.getCronkey(coinId));

    const cachedPrice = await this.cacheManager.get<number>(
      this.getCacheKey(coinId),
    );
    if (cachedPrice) {
      this.logger.debug(`returning cached price: ${cachedPrice}`);
      return cachedPrice;
    }

    const price = await this.fetchAndCacheBitcoinPrice(coinId);
    this.logger.debug(`returning fetched price: ${price}`);
    return price;
  }

  calculatePriceWithInterest(price: number, interestRate?: number): number {
    if (!interestRate) {
      return price;
    }

    return price * (1 + interestRate / 100);
  }

  private getCacheKey(coinId: string) {
    return `${coinId}_price`;
  }

  private getCronkey(coinId: string) {
    return `${coinId}_cron_job`;
  }
}
