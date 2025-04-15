const salesforcesdk = require('@heroku/salesforce-sdk-nodejs');
const logger = require('../utils/logger');

class SalesforceConnector {
  constructor() {
    this.sdk = null;
    this.org = null;
    this.dataApi = null;
    this.isConnected = false;
  }

  async connect() {
    if (this.isConnected) return;

    try {
      // Initialize the SDK
      this.sdk = salesforcesdk.init();
      
      // Connect to the Salesforce org using the environment variable
      this.org = await this.sdk.addons.herokuIntegration.getConnection(process.env.SF_ORG);
      
      // Get the dataApi for CRUD operations
      this.dataApi = this.org.dataApi;
      
      this.isConnected = true;
      logger.info('Connected to Salesforce using Heroku SDK');
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

      const recordToCreate = {
        type: 'Integration__c',
        fields: data
      };

      const result = await this.dataApi.create(recordToCreate);
      
      logger.info(`Created Integration record: ${result.id}`);
      return result;
    } catch (error) {
      logger.error(`Error creating Integration record: ${error.message}`);
      throw error;
    }
  }

  async disconnect() {
    // The Heroku SDK doesn't require explicit disconnection,
    // but we'll reset our state for consistency
    if (this.isConnected) {
      this.org = null;
      this.dataApi = null;
      this.isConnected = false;
      logger.info('Reset Salesforce connection');
    }
  }
}

// Singleton instance
const salesforceConnector = new SalesforceConnector();

module.exports = salesforceConnector; 