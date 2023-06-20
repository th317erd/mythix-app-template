import { defineController } from 'mythix';

// Please change the name of this controller to whatever you want
module.exports = defineController('ExampleController', ({ Parent }) => {
  return class ExampleController extends Parent {
    async hello(params, query, body, models) {
      var currentUser = this.request.user;
      return 'Hello World!';
    }
  };
});
