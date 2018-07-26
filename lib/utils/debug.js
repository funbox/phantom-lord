const { createLogger, format, transports } = require('winston');

const debugLogger = createLogger({
  level: 'debug',
  format: format.combine(
    format.colorize({ all: true }),
    format.simple(),
  ),
  transports: [
    new transports.Console(),
  ],
});

/**
 * @param {string} str
 * @param {'error'|'warn'|'info'|'verbose'|'debug'} [level='debug']
 */
const debug = (str, level = 'debug') => {
  if (process.env.DEBUG) {
    debugLogger.log(level, str);
  }
};

module.exports = debug;
