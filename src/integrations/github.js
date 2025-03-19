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
    if (config.testing) {
      return true;
    }
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