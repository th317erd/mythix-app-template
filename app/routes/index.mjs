/* eslint-disable key-spacing */

'use strict';

// This module defines all application routes.
// The "name" property on routes tells mythix
// to generate this route when generating API
// interfaces for clients.
//
// The "help" scope is used by the API
// interface generator to provide help
// for each generated API interface method.

const {
  authRoutes,
} = require('./auth-routes');

const {
  userRoutes,
} = require('./user-routes');

const {
  organizationRoutes,
} = require('./organization-routes');

module.exports = function({ path }) {
  path('api', ({ path }) => {
    path('v1', (context) => {
      const { endpoint } = context;

      endpoint('client-interface.mjs', 'APIInterfaceController.get');
      endpoint('health', 'HealthCheckController.health');

      authRoutes.call(this, context);
      userRoutes.call(this, context);
      organizationRoutes.call(this, context);
    });
  });
};