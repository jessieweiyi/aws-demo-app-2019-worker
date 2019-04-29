import Logger from '../utils/logger';

const logger = Logger.logger('DBService');

export default class DBService {
  constructor(AWS, dbConfig) {
    this.config = dbConfig;
    this.dynamoDB = new AWS.DynamoDB({
      endpoint: this.config.endpoint,
      apiVersion: '2012-08-10'
    });
  }

  updateJob(job) {
    const params = {
      ExpressionAttributeNames: {
        '#S': 'status',
        '#U': 'url'
      },
      ExpressionAttributeValues: {
        ':s': {
          S: 'completed'
        },
        ':u': {
          S: job.url
        }
      },
      Key: {
        jobId: {
          S: job.jobId
        }
      },
      ReturnValues: 'ALL_NEW',
      TableName: this.config.tableName,
      UpdateExpression: 'SET #S=:s, #U=:u'
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
