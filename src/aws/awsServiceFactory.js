import AWS from 'aws-sdk';
import S3Service from './s3Service';
import SQSService from './sqsService';
import DBService from './dbService';

const awsConfig = {
  region: process.env.AWS_DEFAULT_REGION
};

AWS.config.update(awsConfig);

export default class AWSServiceFactory {
  static getS3Service() {
    const s3Config = {
      bucketName: process.env.AWS_S3_BUCKET_NAME,
      endpoint: process.env.AWS_S3_ENDPOINT,
      s3ForcePathStyle: process.env.AWS_S3_FORCE_PATH_STYLE === 'true'
    };
    return new S3Service(AWS, s3Config);
  }

  static getSQSService() {
    const sqsConfig = {
      queueUrl: process.env.AWS_SQS_QUEUE_URL,
      visibilityTimeout: parseInt(process.env.AWS_SQS_VISIBILITY_TIMEOUT, 10)
    };
    return new SQSService(AWS, sqsConfig);
  }

  static getDBService() {
    const dbConfig = {
      endpoint: process.env.AWS_DYNAMODB_ENDPOINT,
      tableName: process.env.AWS_DYNAMODB_TABLE_NAME
    };
    return new DBService(AWS, dbConfig);
  }
}
