import Logger from '../utils/logger';

const logger = Logger.logger('SQSService');

export default class SQSService {
  constructor(AWS, sqsConfig) {
    this.config = sqsConfig;
    this.sqs = new AWS.SQS();
  }

  getNextJobIfExists() {
    const params = {
      QueueUrl: this.config.queueUrl,
      VisibilityTimeout: this.config.visibilityTimeout
    };

    return new Promise((resolve, reject) => {
      this.sqs.receiveMessage(params, (err, data) => {
        if (err) {
          logger.error(err);
          reject(err);
        } else if (data.Messages && data.Messages.length > 0) {
          logger.debug('Received message from SQS', data);
          if (data.Messages[0] && data.Messages[0].Body) {
            const message = data.Messages[0];
            const job = JSON.parse(message.Body);
            job.receiptHandle = message.ReceiptHandle;
            job.messageId = message.MessageId;

            resolve(job);
          } else {
            resolve(null);
          }
        } else {
          resolve(null);
        }
      });
    });
  }

  commitJob(receiptHandle) {
    if (!receiptHandle) {
      return Promise.resolve({});
    }

    const params = {
      QueueUrl: this.config.queueUrl,
      ReceiptHandle: receiptHandle
    };

    const self = this;
    logger.debug('Start deleting job message from SQS', { receiptHandle });
    return new Promise((resolve, reject) => {
      self.sqs.deleteMessage(params, (err, data) => {
        if (err) {
          logger.error(err);
          reject(err);
        } else {
          logger.debug('Deleted job message from SQS', data);
          resolve(data);
        }
      });
    });
  }
}
