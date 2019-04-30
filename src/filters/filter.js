import Jimp from 'jimp';
import Logger from '../utils/logger';

const logger = Logger.logger('Filter');

export default class Filter {
  constructor(config) {
    this.config = config;
  }

  applyFilter(srcFilePath, destFilePath) {
    logger.debug('starting processing image', {
      srcFilePath,
      destFilePath
    });
    return new Promise((resolve, reject) => {
      Jimp.read(srcFilePath)
        .then(image => this.process(image))
        .then(destImage => destImage.write(destFilePath))
        .then(() => {
          setTimeout(() => {
            resolve(destFilePath);
          }, 5000);
        })
        .catch(err => reject(err));
    });
  }
}
