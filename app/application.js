const Path                = require('path');
const Mythix              = require('mythix');
const getRoutes           = require('./routes');
const cookieParser        = require('cookie-parser');

const {
  AWSModule,
  MailerModule,
} = require('./modules');

const { PostgreSQLConnection } = require('mythix-orm-postgresql');

class Application extends Mythix.Application {
  static APP_NAME = '<<<APP_NAME>>>';

  // Add our "mailer" and "aws" modules
  // to this mythix application
  static getDefaultModules() {
    let defaultModules = Mythix.Application.getDefaultModules();

    return defaultModules.concat([
      MailerModule,
      AWSModule,
    ]);
  }

  constructor(_opts) {
    var opts = Object.assign({
      rootPath: Path.resolve(__dirname),
      httpServer: {
        middleware: [
          cookieParser(),
        ],
      },
    }, _opts || {});

    super(opts);
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

module.exports = {
  Application,
};
