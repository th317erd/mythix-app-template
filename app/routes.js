module.exports = function getRoutes() {
  return {
    'api': {
      'v1': {
        'hello': [
          {
            'methods':    [ 'GET' ],
            'controller': 'InitialController.hello',
          },
        ],
      },
    },
  };
};
