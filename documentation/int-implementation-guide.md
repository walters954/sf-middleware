# Implementation Guide for Salesforce Middleware

## Getting Started

This guide will help you implement the Node.js middleware application described in the PRD. I'll provide code samples for key components to get you started quickly with this POC.

## Step 1: Project Setup

First, create a new Node.js project and install the necessary dependencies:

```bash
mkdir salesforce-middleware
cd salesforce-middleware
npm init -y
npm install express dotenv jsforce body-parser helmet winston cors
npm install --save-dev nodemon
```

## Step 2: Basic Application Structure

Create your project structure following the repository layout from the PRD.

### .env.example file

```
# Salesforce Credentials
SF_USERNAME=your_salesforce_username
SF_PASSWORD=your_salesforce_password
SF_SECURITY_TOKEN=your_salesforce_security_token
SF_LOGIN_URL=https://login.salesforce.com

# Webhook Secrets
GITHUB_WEBHOOK_SECRET=your_github_webhook_secret
SENDGRID_WEBHOOK_SECRET=your_sendgrid_webhook_secret
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

# Application Settings
PORT=3000
NODE_ENV=development
LOG_LEVEL=info
```

Create a `.env` file based on this example and fill in your actual credentials.

### server.js

```javascript
const express = require('express');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const cors = require('cors');
const config = require('./src/config');
const logger = require('./src/utils/logger');
const webhookRoutes = require('./src/routes/webhooks');

// Initialize Express app
const app = express();

// Apply middleware
app.use(helmet());
app.use(cors());
app.use(bodyParser.json());

// Use routes
app.use('/webhooks', webhookRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error(`Error processing request: ${err.message}`);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
const PORT = config.port || 3000;
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});
```

## Step 3: Configuration Module

### src/config/index.js

```javascript
require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3000,
  env: process.env.NODE_ENV || 'development',
  logLevel: process.env.LOG_LEVEL || 'info',
  
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
```

## Step 4: Salesforce Connector

### src/connectors/salesforce.js

```javascript
const jsforce = require('jsforce');
const config = require('../config');
const logger = require('../utils/logger');

class SalesforceConnector {
  constructor() {
    this.conn = null;
    this.isConnected = false;
  }

  async connect() {
    if (this.isConnected) return;

    try {
      this.conn = new jsforce.Connection({
        loginUrl: config.salesforce.loginUrl
      });

      await this.conn.login(
        config.salesforce.username,
        config.salesforce.password + config.salesforce.securityToken
      );

      this.isConnected = true;
      logger.info('Connected to Salesforce');
    } catch (error) {
      logger.error(`Failed to connect to Salesforce: ${error.message}`);
      throw error;
    }
  }

  async createIntegrationRecord(data) {
    try {
      if (!this.isConnected) {
        await this.connect();
      }

      const result = await this.conn.sobject('Integration__c').create(data);
      
      if (result.success) {
        logger.info(`Created Integration record: ${result.id}`);
        return result;
      } else {
        throw new Error(`Failed to create record: ${result.errors.join(', ')}`);
      }
    } catch (error) {
      logger.error(`Error creating Integration record: ${error.message}`);
      throw error;
    }
  }

  async disconnect() {
    if (this.conn) {
      this.conn.logout();
      this.isConnected = false;
      logger.info('Disconnected from Salesforce');
    }
  }
}

// Singleton instance
const salesforceConnector = new SalesforceConnector();

module.exports = salesforceConnector;
```

## Step 5: Logging Utility

### src/utils/logger.js

```javascript
const winston = require('winston');
const config = require('../config');

const logger = winston.createLogger({
  level: config.logLevel,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

module.exports = logger;
```

## Step 6: Security Utilities

### src/utils/security.js

```javascript
const crypto = require('crypto');

/**
 * Verify GitHub webhook signature
 * @param {string} payload - Raw request body
 * @param {string} signature - X-Hub-Signature-256 header value
 * @param {string} secret - GitHub webhook secret
 * @returns {boolean} - Whether signature is valid
 */
function verifyGithubSignature(payload, signature, secret) {
  if (!payload || !signature || !secret) {
    return false;
  }

  const hmac = crypto.createHmac('sha256', secret);
  const digest = 'sha256=' + hmac.update(payload).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
}

/**
 * Verify Stripe webhook signature
 * @param {string} payload - Raw request body
 * @param {string} signature - Stripe-Signature header value
 * @param {string} secret - Stripe webhook secret
 * @returns {boolean} - Whether signature is valid
 */
function verifyStripeSignature(payload, signature, secret) {
  // Implementation would depend on Stripe's library
  // This is a simplified placeholder
  return true;
}

module.exports = {
  verifyGithubSignature,
  verifyStripeSignature
};
```

## Step 7: Base Integration Class

### src/integrations/base.js

```javascript
const salesforceConnector = require('../connectors/salesforce');
const logger = require('../utils/logger');

class BaseIntegration {
  constructor(name) {
    this.name = name;
  }

  /**
   * Process incoming webhook data
   * @param {Object} data - Parsed webhook payload
   * @returns {Promise<Object>} - Result of processing
   */
  async process(data) {
    throw new Error('Method not implemented');
  }

  /**
   * Verify webhook request authenticity
   * @param {Object} req - Express request object
   * @returns {boolean} - Whether request is valid
   */
  verifyRequest(req) {
    throw new Error('Method not implemented');
  }

  /**
   * Send data to Salesforce
   * @param {Object} data - Data to send to Salesforce
   * @returns {Promise<Object>} - Result from Salesforce
   */
  async sendToSalesforce(data) {
    try {
      const sfData = this.transformForSalesforce(data);
      return await salesforceConnector.createIntegrationRecord(sfData);
    } catch (error) {
      logger.error(`Error sending to Salesforce: ${error.message}`);
      throw error;
    }
  }

  /**
   * Transform data for Salesforce Integration object
   * @param {Object} data - Original data
   * @returns {Object} - Transformed data for Salesforce
   */
  transformForSalesforce(data) {
    return {
      Name: `${this.name} Integration ${new Date().toISOString()}`,
      Source__c: this.name,
      Raw_Data__c: JSON.stringify(data),
      Status__c: 'Received'
    };
  }
}

module.exports = BaseIntegration;
```

## Step 8: GitHub Integration

### src/integrations/github.js

```javascript
const BaseIntegration = require('./base');
const security = require('../utils/security');
const config = require('../config');
const logger = require('../utils/logger');

class GitHubIntegration extends BaseIntegration {
  constructor() {
    super('GitHub');
  }

  async process(data) {
    logger.info(`Processing GitHub webhook: ${data.event || 'unknown event'}`);
    
    // Here you would add any GitHub-specific processing logic
    
    return this.sendToSalesforce(data);
  }

  verifyRequest(req) {
    const signature = req.headers['x-hub-signature-256'];
    const payload = JSON.stringify(req.body);
    
    if (!signature) {
      logger.warn('Missing X-Hub-Signature-256 header');
      return false;
    }
    
    const isValid = security.verifyGithubSignature(
      payload,
      signature,
      config.webhooks.github.secret
    );
    
    if (!isValid) {
      logger.warn('Invalid GitHub webhook signature');
    }
    
    return isValid;
  }

  transformForSalesforce(data) {
    const baseData = super.transformForSalesforce(data);
    
    // Add GitHub-specific fields
    return {
      ...baseData,
      Event_Type__c: data.event,
      Repository__c: data.repository?.full_name,
      Sender__c: data.sender?.login
    };
  }
}

module.exports = new GitHubIntegration();
```

## Step 9: Webhook Routes

### src/routes/webhooks.js

```javascript
const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');

// Import integrations
const githubIntegration = require('../integrations/github');
// We'll add SendGrid and Stripe later

// GitHub webhook endpoint
router.post('/github', async (req, res) => {
  try {
    // Extract GitHub event type
    const event = req.headers['x-github-event'];
    
    // Verify webhook signature
    if (!githubIntegration.verifyRequest(req)) {
      return res.status(401).json({ error: 'Invalid signature' });
    }
    
    // Process the webhook data
    const data = {
      event,
      ...req.body,
      headers: req.headers
    };
    
    // Process asynchronously and respond immediately to GitHub
    res.status(202).json({ status: 'processing' });
    
    // Now process the data
    await githubIntegration.process(data);
    logger.info('GitHub webhook processed successfully');
  } catch (error) {
    logger.error(`Error processing GitHub webhook: ${error.message}`);
    // We've already responded to GitHub, so we just log the error
  }
});

// SendGrid webhook endpoint (placeholder)
router.post('/sendgrid', (req, res) => {
  // To be implemented
  res.status(501).json({ status: 'not implemented' });
});

// Stripe webhook endpoint (placeholder)
router.post('/stripe', (req, res) => {
  // To be implemented
  res.status(501).json({ status: 'not implemented' });
});

module.exports = router;
```

## Step 10: Update package.json Scripts

```json
"scripts": {
  "start": "node server.js",
  "dev": "nodemon server.js",
  "test": "echo \"Error: no test specified\" && exit 1"
}
```

## Next Steps

1. Implement the SendGrid and Stripe integrations following the same pattern as GitHub
2. Set up a Salesforce sandbox with an Integration__c custom object
3. Test locally with a tool like ngrok to receive actual webhooks
4. Deploy to Heroku once tested

## Testing

You can use tools like Postman or curl to test your webhook endpoints locally before connecting to actual webhook sources. For GitHub webhook testing, consider using their webhook payload examples from their documentation.

## Deploying to Heroku

```bash
# Initialize git repository if not already done
git init
git add .
git commit -m "Initial commit"

# Create Heroku app
heroku create salesforce-middleware

# Set environment variables
heroku config:set SF_USERNAME=your_username
heroku config:set SF_PASSWORD=your_password
heroku config:set SF_SECURITY_TOKEN=your_token
heroku config:set GITHUB_WEBHOOK_SECRET=your_secret
# Add other environment variables...

# Deploy
git push heroku master
```

This implementation guide should give you a solid foundation to build out your Salesforce middleware POC. The modular design makes it easy to add new integrations as needed.