const Nife        = require('nife');
const database    = require('./db-config');
const sensitive   = require('./sensitive');
const { Logger }  = require('mythix');

module.exports = Nife.extend(true, {
  environment:  process.env.NODE_ENV || 'development',
  database,
  logger: {
    level: Logger.DEBUG,
  },
}, sensitive);
