'use strict';

const { DateTime}     = require('luxon');
const { defineModel } = require('mythix');
const { ModelBase }   = require('./model-base');
const Utils           = require('../utils');

// This model blacklists TWT
// tokens, marking them as
// no-longer valid.
//
// "purgeAt" is set to 120 seconds
// beyond the expire time of the
// token itself. Past this time, we
// can purge the token from the database
// to keep things clean.

module.exports = defineModel('InvalidToken', ({ Parent, Types }) => {
  return class _InvalidToken extends Parent {
    static fields = {
      ...(Parent.fields || {}),
      id: {
        type:         Types.XID({ prefix: Utils.getModelIDPrefixFor('InvalidToken') }),
        defaultValue: Types.XID.Default.XID,
        allowNull:    false,
        primaryKey:   true,
      },
      tokenHash: {
        // eslint-disable-next-line no-magic-numbers
        type:         Types.STRING(32),
        allowNull:    false,
        index:        true,
      },
      purgeAt: {
        type:         Types.DATETIME,
        allowNull:    false,
        index:        true,
      },
    };

    static async createForToken(token) {
      let {
        InvalidToken,
      } = this.getModels();

      let app = this.getApplication();

      // Purge expired tokens
      try {
        await InvalidToken.where.purgeAt.LT(DateTime.now()).destroy();
      } catch (error) {}

      // Blacklist token
      try {
        let claims = Utils.verifyTWT(token, app.getSalt());

        await InvalidToken.create({
          tokenHash:  Utils.MD5(token),
          // eslint-disable-next-line no-magic-numbers
          purgeAt:    (claims.expiresAt + 120) * 1000.0,
        });
      } catch (error) {}
    }

    static async isInvalid(token) {
      let {
        InvalidToken,
      } = this.getModels();

      let tokenHash = Utils.MD5(token);
      return await InvalidToken.where.tokenHash.EQ(tokenHash).exists();
    }
  };
}, ModelBase);
