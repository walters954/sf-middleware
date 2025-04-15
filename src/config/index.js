require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3000,
  env: process.env.NODE_ENV || 'development',
  logLevel: process.env.LOG_LEVEL || 'info',
  testing: process.env.TESTING === 'true' || false,
  
  salesforce: {
    org: process.env.SF_ORG
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