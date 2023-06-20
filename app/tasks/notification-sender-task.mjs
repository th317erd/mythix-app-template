'use strict';

import { defineTask } from 'mythix';

const DEFAULT_WORKER_COUNT              = 4;
const DEFAULT_WORKER_FREQUENCY_SECONDS  = 5;

module.exports = defineTask('NotificationSenderTask', ({ application, Parent, time }) => {
  const workerCount = application.getConfigValue('application.{environment}.tasks.NotificationSenderTask.workers', DEFAULT_WORKER_COUNT, 'integer');

  return class BatchQueueWebhooks extends Parent {
    static workers    = workerCount;

    static frequency  = time.seconds(DEFAULT_WORKER_FREQUENCY_SECONDS * workerCount);

    static startDelay = time.seconds(DEFAULT_WORKER_FREQUENCY_SECONDS);

    static keepAlive  = true;

    static enabled    = true;

    async execute() {
      let { Notification } = this.getModels();

      await Notification.getBatchToProcess(this.getRunID(), async (notification, user) => {
        let application = this.getApplication();

        if (notification.type === 'email') {
          let mailer = application.getMailer();
          await mailer.sendEmail({
            to:       user.email,
            subject:  notification.subject,
            message:  notification.content,
          });
        }
      });
    }
  };
});
