import { Injectable, Logger } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob, CronTime } from 'cron';

@Injectable()
export class CronService {
  private requestCount = 0;
  private lastRequestCount = 0;
  private interval = '*/60 * * * * *'; // cada 60 segundos

  private BIG_LOAD = 500;
  private MEDIUM_LOAD = 100;

  private jobName: string = '';

  private readonly logger = new Logger(CronService.name);

  constructor(private readonly schedulerRegistry: SchedulerRegistry) {}

  public addRequestCount() {
    this.requestCount++;
  }

  public addCronJob(jobName: string, cronFunction: () => unknown) {
    this.jobName = jobName;
    const job = new CronJob(this.interval, () => {
      cronFunction();
    });
    this.schedulerRegistry.addCronJob(this.jobName, job);
    job.start();
  }

  private updateCronJobInterval(newInterval: string) {
    const job = this.schedulerRegistry.getCronJob(this.jobName);
    job.setTime(new CronTime(newInterval));
    job.start();
  }

  public adjustCronInterval() {
    const requestRate = this.requestCount - this.lastRequestCount;
    this.lastRequestCount = this.requestCount;

    let newInterval = this.interval;
    // Ajustar el intervalo basado en el número de solicitudes recibidas
    if (requestRate > this.BIG_LOAD) {
      newInterval = '*/30 * * * * *'; // cada 30 segundos
    } else if (requestRate > this.MEDIUM_LOAD) {
      newInterval = '*/60 * * * * *'; // cada 60 segundos
    } else {
      newInterval = '*/120 * * * * *'; // cada 120 segundos
    }

    if (newInterval !== this.interval) {
      this.interval = newInterval;
      this.updateCronJobInterval(this.interval);
      this.logger.verbose(`adjusting interval to run job to: ${this.interval}`);
    }
  }
}