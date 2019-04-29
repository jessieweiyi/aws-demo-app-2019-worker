import Logger from '../utils/logger';

const logger = Logger.logger('JobMonitor');

export default class JobMonitor {
  constructor(commonConfig, sqsService, jobProcessor) {
    this.checkInterval = commonConfig.checkInterval;
    this.maxNumCheckError = commonConfig.maxNumCheckError;
    this.sqsService = sqsService;
    this.jobProcessor = jobProcessor;
    this.config = commonConfig;
  }

  start() {
    this.startMonitor();
  }

  startMonitor(countRetries = 0) {
    const self = this;
    setTimeout(() => {
      logger.debug('Checking for new job');
      self.checkForNewJob()
        .then(() => {
          self.startMonitor();
        }).catch((err) => {
          logger.error(err);
          if (countRetries >= self.maxNumCheckError) {
            logger.fatal('Maximum Retires Reached. Process Exit');
            process.exit(1);
          }

          logger.info(`Retrying ${countRetries + 1} of ${self.maxNumCheckError} in ${((2 ** (countRetries + 1)) * self.checkInterval) / 1000} seconds`);
          self.startMonitor(countRetries + 1);
        });
    }, (2 ** countRetries) * self.checkInterval);
  }

  checkForNewJob() {
    return this.sqsService.getNextJobIfExists().then((job) => {
      if (job) {
        logger.info('Received new job', job);
        return this.jobProcessor.process(job);
      }

      return null;
    });
  }
}
