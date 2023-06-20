import { defineCommand } from 'mythix';
import Utils from '../utils.mjs';
import { seedDB } from '../seeders/initial-db-seeder.mjs';

module.exports = defineCommand('shell', ({ Parent }) => {
  return class ShellCommand extends Parent {
    onStart(interactiveShell) {
      var context = interactiveShell.context;

      // Inject into "context" to expose globals in the shell
      // or customize your shell startup however you desire here
      Object.assign(context, {
        seedDB: seedDB.bind(context.application, context.application),
        Utils,
      });
    }
  };
}, 'shell');
