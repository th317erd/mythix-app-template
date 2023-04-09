'use strict';

const { defineController }  = require('mythix');
const { ControllerBase }    = require('./controller-base.js');

module.exports = defineController('HealthCheckController', ({ Parent }) => {
  return class HealthCheckController extends Parent {
    async health() {
      let application = this.getApplication();
      let connection  = application.getConnection();

      await connection.query('SELECT 1+1');

      this.setStatusCode(200);
      return '';
    }
  };
}, ControllerBase);
