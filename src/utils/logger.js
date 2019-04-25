import bunyan from 'bunyan';

export default class Logger {
  constructor(name) {
    const logFile = process.env.LOG_FILE;
    const logLevel = process.env.LOG_LEVEL || 'info';
    const streams = (logFile) ? [{
      type: 'file',
      path: logFile,
      level: logLevel
    }] : [{
      stream: process.stdout,
      level: logLevel
    }];
    this.logger = bunyan.createLogger({ name, streams });
  }

  static logger(className) {
    return new Logger(className);
  }

  debug(msg, ...args) {
    Logger.callLogger(this.logger.debug.bind(this.logger), msg, ...args);
  }

  warn(msg, ...args) {
    Logger.callLogger(this.logger.warn.bind(this.logger), msg, ...args);
  }

  info(msg, ...args) {
    Logger.callLogger(this.logger.info.bind(this.logger), msg, ...args);
  }

  error(msg, ...args) {
    Logger.callLogger(this.logger.error.bind(this.logger), msg, ...args);
  }

  fatal(msg, ...args) {
    Logger.callLogger(this.logger.fatal.bind(this.logger), msg, ...args);
  }

  static callLogger(func, msg, ...args) {
    const obj = Logger.mergeArgs(...args);

    if (obj === null) {
      func(msg);
    } else {
      func(obj, msg);
    }
  }

  static mergeArgs(...args) {
    if (!args || args.length === 0) {
      return null;
    }

    if (args.length === 1) {
      return args[0];
    }

    let mergedObj = {};

    args.forEach((arg) => {
      mergedObj = Object.assign(mergedObj, arg);
    });

    return mergedObj;
  }
}
