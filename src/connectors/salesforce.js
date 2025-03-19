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