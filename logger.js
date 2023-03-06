const winston = require("winston");
const DailyRotateFile = require("winston-daily-rotate-file");

// Add log file rotation
const transport = new DailyRotateFile({
  filename: "./Logs/application-%DATE%.log",
  datePattern: "YYYY-MM-DD",
  zippedArchive: true,
  maxSize: "1m",
  maxFiles: "20",
  prepend: true,
  level: process.env.LOGGING_LEVEL,
  //auditFile: `./Logs/xrcie.${process.env.LOGGING_LEVEL}-audit.json`,
});

// Create logger
const logger = winston.createLogger({
  level: process.env.LOGGING_LEVEL,
  transports: [transport],
  format: winston.format.combine(
    winston.format.timestamp({ format: "MMM-DD-YYYY HH:mm:ss" }),
    winston.format.printf(
      (info) => `${info.level}: ${[info.timestamp]}: ${info.message}`
    )
  ),
});

//
// If we're not in production then log to the `console` with the format:
// `${info.level}: ${info.message} JSON.stringify({ ...rest }) `
//
if (process.env.NODE_ENV != "production") {
  logger.remove(transport);
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp({ format: "MMM-DD-YYYY HH:mm:ss" }),
        winston.format.printf(
          (info) => `${info.level} : ${[info.timestamp]}: ${info.message}`
        )
      ),
    })
  );
}

module.exports = logger;
