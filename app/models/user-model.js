const { defineModel }   = require('mythix');
const uuid              = require('uuid');

const {
  hashUserToken,
} = require('../utils');

module.exports = defineModel('User', ({ Parent, Type }) => {
  return class User extends Parent {
    static fields = {
      id: {
        type:         Type.UUID,
        defaultValue: Type.UUIDV4,
        primaryKey:   true,
      },
      role: {
        type:         Type.STRING(32),
        allowNull:    false,
        defaultValue: 'user',
        index:        true,
      },
      email: {
        type:         Type.STRING(64),
        allowNull:    false,
        index:        true,
      },
      firstName: {
        type:         Type.STRING(32),
        allowNull:    false,
        index:        true,
      },
      lastName: {
        type:         Type.STRING(32),
        allowNull:    false,
        index:        true,
      },
      authToken: {
        type:         Type.STRING(64),
        allowNull:    false,
        index:        true,
      },
    };

    static async newUser(attrs) {
      var application   = User.getApplication();
      var token         = attrs.token || uuid.v4();
      var salt          = application.getConfigValue('salt', '');
      var authToken     = hashUserToken(salt, token);

      delete attrs.token;

      var userAttrs = Object.assign({}, attrs, { authToken });
      var user      = await User.create(userAttrs);

      console.log(`Successfully created user ${userAttrs.firstName} ${userAttrs.lastName} with auth token of ${token} and secret of ${userAttrs.webhookSecret}`);

      return user;
    }
  };
});
