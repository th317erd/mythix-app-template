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
  application: {
    development: {
      domain:             '<<<APP_NAME>>>.com',
      appRootURL:         'https://<<<APP_NAME>>>.com/',
      mfaPageURL:         'https://<<<APP_NAME>>>.com/pages/mfa',
      afterLoginPageURL:  'https://<<<APP_NAME>>>.com/pages/home',
      magicLinkURL:       'https://<<<APP_NAME>>>.com/login',
      getHelpURL:         'https://gethelp.com/',
      aws: {
        s3: {
          bucket: '<<<APP_NAME>>>-staging',
          region: 'us-west-1',
        },
      },
    },
  },
}, sensitive);
