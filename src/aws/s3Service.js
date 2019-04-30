import fs from 'fs';
import Logger from '../utils/logger';

const logger = Logger.logger('S3Service');

export default class S3Service {
  constructor(AWS, s3config) {
    this.config = s3config;
    const connConfig = {};
    if (this.config.endpoint) {
      connConfig.endpoint = this.config.endpoint;
    }
    connConfig.s3ForcePathStyle = this.config.s3ForcePathStyle;

    this.s3 = new AWS.S3(connConfig);
  }

  downloadObject(objectKey, filePath) {
    const self = this;

    return new Promise((resolve, reject) => {
      self.s3.getObject({
        Bucket: self.config.bucketName,
        Key: objectKey
      }, (err, data) => {
        if (err) {
          reject(err);
        } else {
          try {
            fs.writeFileSync(filePath, data.Body);
          } catch (fsWriteError) {
            reject(fsWriteError);
          }
          logger.debug('S3 Object Downloaded', { objectKey });
          resolve(filePath);
        }
      });
    });
  }

  uploadObject(filePath, objectKey) {
    const self = this;

    return new Promise((resolve, reject) => {
      let fileContent = null;
      try {
        fileContent = fs.readFileSync(filePath);
      } catch (fsReadError) {
        reject(fsReadError);
      }
      self.s3.putObject({
        Bucket: self.config.bucketName,
        Key: objectKey,
        Body: fileContent,
        ACL: 'public-read'
      }, (err) => {
        if (err) {
          reject(err);
        } else {
          logger.debug('S3 Object Uploaded', { objectKey });
          const fullUrl = `${self.config.endpoint}/${self.config.bucketName}/${objectKey}`;
          resolve(fullUrl);
        }
      });
    });
  }
}
