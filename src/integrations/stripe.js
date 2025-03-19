const BaseIntegration = require('./base');
const security = require('../utils/security');
const config = require('../config');
const logger = require('../utils/logger');

class StripeIntegration extends BaseIntegration {
  constructor() {
    super('Stripe');
  }

  async process(data) {
    logger.info(`Processing Stripe webhook: ${data.type || 'unknown event'}`);
    
    // Here you would add any Stripe-specific processing logic
    
    return this.sendToSalesforce(data);
  }

  verifyRequest(req) {
    const signature = req.headers['stripe-signature'];
    const payload = JSON.stringify(req.body);
    
    if (!signature) {
      logger.warn('Missing Stripe-Signature header');
      return false;
    }
    
    const isValid = security.verifyStripeSignature(
      payload,
      signature,
      config.webhooks.stripe.secret
    );
    
    if (!isValid) {
      logger.warn('Invalid Stripe webhook signature');
    }
    
    return isValid;
  }

  transformForSalesforce(data) {
    const baseData = super.transformForSalesforce(data);
    
    // Add Stripe-specific fields
    return {
      ...baseData,
      Event_Type__c: data.type,
      Customer_Id__c: data.data?.object?.customer,
      Amount__c: data.data?.object?.amount ? data.data.object.amount / 100 : null,
      Created__c: data.created ? new Date(data.created * 1000).toISOString() : null
    };
  }
}

module.exports = new StripeIntegration(); 