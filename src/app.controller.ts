import { Body, Controller, HttpException, Param, Post } from '@nestjs/common';
import { AppService } from './app.service';
import { CryptoService } from './crypto/crypto.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly cryptoService: CryptoService,
  ) {}

  @Post('price/:crypto')
  async getPriceWithInterest(
    @Param('crypto') cryptoCurrency: string = 'btc',
    @Body('interest_rate') interestRate?: number,
  ) {
    if (!this.cryptoService.isCurrencyAccepted(cryptoCurrency)) {
      return new HttpException('Invalid currency provided', 400);
    }

    const price = await this.appService.getBitcoinPrice();
    const newPrice = this.appService.calculatePriceWithInterest(
      price,
      interestRate,
    );

    return {
      original_price: price,
      interest_rate: interestRate ?? 'N/A',
      new_price: newPrice,
    };
  }
}
