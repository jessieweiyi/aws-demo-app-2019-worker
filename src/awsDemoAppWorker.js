import AWSServiceFactory from './aws/awsServiceFactory';
import WarholFilter from './filters/warholFilter';
import JobMonitor from './job_handlers/jobMonitor';
import JobProcessor from './job_handlers/jobProcessor';

require('dotenv').config();

export default class AWSDemoAppWorker {
  constructor() {
    const config = {
      checkInterval: process.env.CHECK_INTERVAL,
      tempFileFolder: process.env.TEMP_FILE_FOLDER
    };
    const imageFilter = new WarholFilter(config);
    const jobProcessor = new JobProcessor(config,
      AWSServiceFactory.getSQSService(),
      AWSServiceFactory.getS3Service(),
      AWSServiceFactory.getDBService(),
      imageFilter);

    this.jobMonitor = new JobMonitor(config,
      AWSServiceFactory.getSQSService(),
      jobProcessor);
  }

  start() {
    this.jobMonitor.start();
  }
}
