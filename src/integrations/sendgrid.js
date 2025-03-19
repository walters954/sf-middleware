const BaseIntegration = require('./base');
const security = require('../utils/security');
const config = require('../config');
const logger = require('../utils/logger');

class SendGridIntegration extends BaseIntegration {
  constructor() {
    super('SendGrid');
  }

  async process(data) {
    logger.info(`Processing SendGrid webhook: ${data.event || 'unknown event'}`);
    
    // Here you would add any SendGrid-specific processing logic
    
    return this.sendToSalesforce(data);
  }

  verifyRequest(req) {
    const signature = req.headers['x-sendgrid-signature'];
    const payload = JSON.stringify(req.body);
    
    if (!signature) {
      logger.warn('Missing SendGrid signature header');
      return false;
    }
    
    const isValid = security.verifySendGridSignature(
      payload,
      signature,
      config.webhooks.sendgrid.secret
    );
    
    if (!isValid) {
      logger.warn('Invalid SendGrid webhook signature');
    }
    
    return isValid;
  }

  transformForSalesforce(data) {
    const baseData = super.transformForSalesforce(data);
    
    // Add SendGrid-specific fields, assuming a standard SendGrid event structure
    return {
      ...baseData,
      Event_Type__c: data.event,
      Email__c: data.email,
      Timestamp__c: data.timestamp ? new Date(data.timestamp * 1000).toISOString() : null
    };
  }
}

module.exports = new SendGridIntegration(); 