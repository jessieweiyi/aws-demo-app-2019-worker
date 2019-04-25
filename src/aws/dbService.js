import Logger from '../utils/logger';

const logger = Logger.logger('DBService');

export default class DBService {
  constructor(AWS, dbConfig) {
    this.config = dbConfig;
    this.dynamoDB = new AWS.DynamoDB({
      endpoint: this.config.endpoint
    });
  }

  updateJob(job) {
    const params = {
      TableName: this.config.tableName,
      Key: {
        jobId: {
          S: job.jobId
        }
      },
      UpdateExpression: 'SET status= :s, set url= :u',
      ExpressionAttributeValues: {
        ':s': {
          S: 'completed'
        },
        ':u': {
          S: job.url
        }
      },
      ReturnValues: 'ALL_NEW'
    };
    return new Promise((resolve, reject) => {
      this.dynamoDB.updateItem(params, (error, data) => {
        if (error) {
          logger.debug('Failed in updating job status', error);
          reject(error);
        } else {
          logger.debug('Succeed in updating job status', error);
          resolve(data);
        }
      });
    });
  }
}
