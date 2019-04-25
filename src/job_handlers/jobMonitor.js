import Logger from '../utils/logger';

const logger = Logger.logger('JobMonitor');

export default class JobMonitor {
  constructor(commonConfig, sqsService, jobProcessor) {
    this.checkInterval = commonConfig.checkInterval;
    this.sqsService = sqsService;
    this.jobProcessor = jobProcessor;
    this.config = commonConfig;
  }

  start() {
    this.startMonitor();
  }

  startMonitor() {
    const self = this;
    setTimeout(() => {
      self.checkForNewJob()
        .then(() => {
          self.startMonitor();
        }).catch((err) => {
          logger.error(err);
          self.startMonitor();
        });
    }, self.checkInterval);
  }

  checkForNewJob() {
    const self = this;
    return self.sqsService.getNextJobIfExists().then((job) => {
      if (job) {
        logger.info('Received new job', job);
        return self.jobProcessor.process(job);
      }

      return null;
    });
  }
}
