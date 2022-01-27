const { defineController } = require('mythix');

// Please change the name of this controller to whatever you want
module.exports = defineController('InitialController', ({ Parent }) => {
  return class InitialController extends Parent {
    async hello(params, query, body, models) {
      var currentUser = this.request.user;
      return 'Hello World!';
    }
  };
});
