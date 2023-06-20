import { Application } from './application.js';

(async function() {
  const app = new Application({ exitOnShutdown: 0 });
  await app.start();
})();
