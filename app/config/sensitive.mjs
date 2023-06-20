export default {
  application: {
    development: {
      salt: '<<<GENERATE_SALT>>>',
      aws:  {
        s3: {
          accessKeyID:      'yourAccessKeyID',
          secretAccessKey:  'yourSecretKey',
        },
      },
      mailer: {
        domain: 'mail.smtp.com',
        apiKey: 'youMailerAPIKey',
      },
    },
  },
};
