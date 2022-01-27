const { defineCommand } = require('mythix');

module.exports = defineCommand('shell', ({ Parent }) => {
  return class ShellCommand extends Parent {
    onStart(interactiveShell) {
      var context = interactiveShell.context;

      // Inject into "context" to expose globals in the shell
      // or customize your shell startup however you desire here
    }
  };
}, 'shell');
