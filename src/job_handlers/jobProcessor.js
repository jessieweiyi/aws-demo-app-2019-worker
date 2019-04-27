import path from 'path';
import FileHelper from '../helpers/fileHelper';
import Logger from '../utils/logger';

const logger = Logger.logger('JobProcessor');

export default class JobProcessor {
  constructor(config, sqsService, s3Service, dbService, imageFilter) {
    this.sqsService = sqsService;
    this.s3Service = s3Service;
    this.dbService = dbService;
    this.imageFilter = imageFilter;
    this.config = config;
  }

  process(job) {
    return new Promise((resolve, reject) => {
      let jobFileDetails = null;
      try {
        jobFileDetails = this.getJobFileDetails(job);
      } catch (error) {
        reject(error);
      }

      this.s3Service.downloadObject(job.objectKey, jobFileDetails.downloadFilePath)
        .then(sourceFilePath => this.imageFilter.applyFilter(sourceFilePath,
          jobFileDetails.destFilePath))
        .then(destFilePath => this.s3Service.uploadObject(destFilePath,
          jobFileDetails.destObjectKey))
        .then(url => this.dbService.updateJob({
          jobId: job.jobId,
          url
        }))
        .then(() => this.sqsService.commitJob(job.receiptHandle))
        .catch((error) => {
          logger.error('Error caught', error);
        })
        .then(() => {
          FileHelper.deleteFolderRecursively(jobFileDetails.jobBaseFolderPath);
          resolve(job);
        })
        .catch((error) => {
          reject(error);
        });
    });
  }

  getJobFileDetails(job) {
    const jobFileDetails = {};
    jobFileDetails.jobBaseFolderPath = this.getJobBaseFolder(job.jobId);
    FileHelper.createFolderRecursivelyIfNotExist(jobFileDetails.jobBaseFolderPath);
    const fileName = JobProcessor.getFilename(job.objectKey);
    jobFileDetails.downloadFilePath = path.join(jobFileDetails.jobBaseFolderPath, fileName);
    jobFileDetails.destFileName = `dest_${fileName}`;
    jobFileDetails.destFilePath = path.join(jobFileDetails.jobBaseFolderPath,
      jobFileDetails.destFileName);
    jobFileDetails.destObjectKey = `${job.jobId}/${jobFileDetails.destFileName}`;
    return jobFileDetails;
  }

  getJobBaseFolder(jobId) {
    return path.join(this.config.tempFileFolder, jobId);
  }

  static getFilename(objectKey) {
    const parts = objectKey.split('/');
    return parts[parts.length - 1];
  }
}
