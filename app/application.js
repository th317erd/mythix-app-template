import Mythix from 'mythix';
import getRoutes from './routes/index.js';
import cookieParser from 'cookie-parser';
import { PostgreSQLConnection } from 'mythix-orm-postgresql';

import {
  AWSModule,
  MailerModule,
} from './modules/index.js';

import APP_CONFIG from './config/index.js';

export class Application extends Mythix.Application {
  static getName() {
    return '<<<APP_NAME>>>';
  }

  // Add our "mailer" and "aws" modules
  // to this mythix application
  static getModules() {
    return {
      ...super.getModules(),
      mailer: MailerModule,
      aws:    AWSModule,
    };
  }

  constructor(options) {
    const {
      environment,
      database,
      logger,
    } = APP_CONFIG;

    super({
      config: APP_CONFIG,
      httpServer: {
        middleware: [
          cookieParser(),
        ],
      },
      environment,
      database,
      logger,
      ...(options || {}),
    });
  }

  getRoutes(...args) {
    return getRoutes.apply(this, args);
  }

  getSalt() {
    if (this._cachedSalt)
      return this._cachedSalt;

    let salt = this.getConfigValue('application.{environment}.salt');
    if (!salt)
      throw new Error('Application "salt" is empty.');

    Object.defineProperties(this, {
      '_cachedSalt': {
        writable:     false,
        enumerable:   false,
        configurable: false,
        value:        salt,
      },
    });

    return salt;
  }

  getAuthTokenCookieName() {
    return `${this.getApplicationName().replace(/[^a-zA-Z0-9]+/g, '-').replace(/^[^a-zA-Z0-9]+/, '').replace(/[^a-zA-Z0-9]+$/, '')}-auth-token`;
  }

  async createDatabaseConnection(dbConfig) {
    let connection = new PostgreSQLConnection(dbConfig);

    await connection.start();

    return connection;
  }
}
