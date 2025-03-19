require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3000,
  env: process.env.NODE_ENV || 'development',
  logLevel: process.env.LOG_LEVEL || 'info',
  testing: process.env.TESTING === 'true' || false,
  salesforce: {
    username: process.env.SF_USERNAME,
    password: process.env.SF_PASSWORD,
    securityToken: process.env.SF_SECURITY_TOKEN,
    loginUrl: process.env.SF_LOGIN_URL || 'https://login.salesforce.com'
  },
  
  webhooks: {
    github: {
      secret: process.env.GITHUB_WEBHOOK_SECRET
    },
    sendgrid: {
      secret: process.env.SENDGRID_WEBHOOK_SECRET
    },
    stripe: {
      secret: process.env.STRIPE_WEBHOOK_SECRET
    }
  }
}; 