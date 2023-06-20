import Nife from 'nife';
import database from './db-config.js';
import sensitive from './sensitive.js';
import { Logger } from 'mythix';

const APP_CONFIG = Nife.extend(true, {
  environment:  process.env.NODE_ENV || 'development',
  logger: {
    level: Logger.DEBUG,
  },
  httpServer: {
    host: 'localhost',
    port: 8001,
  },
  database,
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

export default APP_CONFIG;
