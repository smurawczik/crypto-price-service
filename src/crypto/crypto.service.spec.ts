import { Test, TestingModule } from '@nestjs/testing';
import { CryptoService } from './crypto.service';

describe('CryptoService', () => {
  let service: CryptoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CryptoService],
    }).compile();

    service = module.get<CryptoService>(CryptoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it.each([
    ['bitcoin', true],
    ['ethereum', true],
    ['another_coin', false],
  ])(`when verifying %s return %b`, (coin, expected) => {
    expect(service.isCoinIdSupported(coin)).toEqual(expected);
  });
});
