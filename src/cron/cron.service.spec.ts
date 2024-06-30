import { Test, TestingModule } from '@nestjs/testing';
import { CronService } from './cron.service';
import { SchedulerRegistry } from '@nestjs/schedule';

describe('CryptoCronService', () => {
  jest.useFakeTimers();

  let service: CronService;

  const cronJobName = 'simulated_cron_job';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CronService, SchedulerRegistry],
    }).compile();

    service = module.get<CronService>(CronService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should define a cron job and verify it was properly created', () => {
    const fn = jest.fn();
    service.addCronJobIfNotExists(cronJobName, fn);

    expect(service.doesCronExist(cronJobName)).toBeTruthy();
  });

  it('should call function after 3 minutes passed', () => {
    const fn = jest.fn();
    service.addCronJobIfNotExists(cronJobName, fn);

    jest.advanceTimersByTime(60 * (1000 * 3));

    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('should call function twice as often after surpassing 10x requests', () => {
    const fn = jest.fn();
    service.addCronJobIfNotExists(cronJobName, fn);

    service.addRequestCount(cronJobName);
    service.adjustCronInterval(cronJobName);
    service.addRequestCount(cronJobName);
    service.addRequestCount(cronJobName);
    service.addRequestCount(cronJobName);
    service.addRequestCount(cronJobName);
    service.addRequestCount(cronJobName);
    service.addRequestCount(cronJobName);
    service.addRequestCount(cronJobName);
    service.addRequestCount(cronJobName);
    service.addRequestCount(cronJobName);
    service.addRequestCount(cronJobName);
    service.addRequestCount(cronJobName);
    service.adjustCronInterval(cronJobName);

    jest.advanceTimersByTime(60 * (1000 * 5));

    expect(fn).toHaveBeenCalledTimes(10);
  });
});
