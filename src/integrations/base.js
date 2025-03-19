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