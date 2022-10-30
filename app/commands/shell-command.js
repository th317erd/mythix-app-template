const { defineCommand } = require('mythix');
const Utils             = require('../utils');
const { seedDB }        = require('../seeders/initial-db-seeder');

module.exports = defineCommand('shell', ({ Parent }) => {
  return class ShellCommand extends Parent {
    onStart(interactiveShell) {
      var context = interactiveShell.context;

      // Inject into "context" to expose globals in the shell
      // or customize your shell startup however you desire here
      Object.assign(context, {
        Utils,
        seedDB,
      });
    }
  };
}, 'shell');
