import { Body, Controller, HttpException, Param, Post } from '@nestjs/common';
import { AppService } from './app.service';
import { CryptoService } from './crypto/crypto.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly cryptoService: CryptoService,
  ) {}

  @Post('price/:coinId')
  async getPriceWithInterest(
    @Param('coinId') coinId: string = 'bitcoin',
    @Body('interest_rate') interestRate?: number,
  ) {
    if (!this.cryptoService.isCoinIdSupported(coinId)) {
      return new HttpException(
        'Invalid coin id provided, example of coin id: "bitcoin"',
        400,
      );
    }

    const price = await this.appService.getCryptoPrice(coinId);
    const newPrice = this.appService.calculatePriceWithInterest(
      price,
      interestRate,
    );

    if (!price) {
      return new HttpException('too many requests', 429);
    }

    return {
      original_price: price,
      interest_rate: interestRate ?? 'N/A',
      new_price: newPrice,
      formatted_price: new Intl.NumberFormat('en', {
        currency: 'USD',
        style: 'currency',
      }).format(newPrice),
    };
  }
}
