import Logger from '../utils/logger';

const logger = Logger.logger('Filter');

export default class Filter {
  constructor(config) {
    this.config = config;
  }

  applyFilter(srcFilePath, destFilePath) {
    logger.debug('starting processing image', { filePath: srcFilePath });
    return new Promise((resolve) => {
      this.process();
      destFilePath = srcFilePath;
      resolve(destFilePath);
    });
  }
}
