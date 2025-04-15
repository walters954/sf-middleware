const salesforcesdk = require('@heroku/salesforce-sdk-nodejs');
const config = require('../config');
const logger = require('../utils/logger');

class SalesforceConnector {
  constructor() {
    this.sdk = salesforcesdk.init();
    this.org = null;
    this.dataApi = null;
  }

  async initialize() {
    if (this.dataApi) return;

    try {
      // Get the connection using the simpler method
      this.org = await this.sdk.addons.herokuIntegration.getConnection(config.salesforce.org);
      this.dataApi = this.org.dataApi;
      
      logger.info(`Initialized Salesforce connection for org: ${config.salesforce.org}`);
    } catch (error) {
      logger.error(`Failed to initialize Salesforce connection: ${error.message}`);
      throw error;
    }
  }

  async createIntegrationRecord(data) {
    try {
      if (!this.dataApi) {
        await this.initialize();
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

  async query(soql) {
    try {
      if (!this.dataApi) {
        await this.initialize();
      }

      const results = await this.dataApi.query(soql);
      return results;
    } catch (error) {
      logger.error(`Error executing SOQL query: ${error.message}`);
      throw error;
    }
  }

  async updateRecord(type, id, fields) {
    try {
      if (!this.dataApi) {
        await this.initialize();
      }

      const recordToUpdate = {
        type,
        fields: {
          Id: id,
          ...fields
        }
      };

      const result = await this.dataApi.update(recordToUpdate);
      logger.info(`Updated ${type} record: ${result.id}`);
      return result;
    } catch (error) {
      logger.error(`Error updating ${type} record: ${error.message}`);
      throw error;
    }
  }

  async deleteRecord(type, id) {
    try {
      if (!this.dataApi) {
        await this.initialize();
      }

      const result = await this.dataApi.delete(type, id);
      logger.info(`Deleted ${type} record: ${id}`);
      return result;
    } catch (error) {
      logger.error(`Error deleting ${type} record: ${error.message}`);
      throw error;
    }
  }

  async createUnitOfWork() {
    try {
      if (!this.dataApi) {
        await this.initialize();
      }

      return this.dataApi.newUnitOfWork();
    } catch (error) {
      logger.error(`Error creating Unit of Work: ${error.message}`);
      throw error;
    }
  }

  async commitUnitOfWork(uow) {
    try {
      if (!this.dataApi) {
        await this.initialize();
      }

      const results = await this.dataApi.commitUnitOfWork(uow);
      logger.info('Successfully committed Unit of Work');
      return results;
    } catch (error) {
      logger.error(`Error committing Unit of Work: ${error.message}`);
      throw error;
    }
  }
}

// Singleton instance
const salesforceConnector = new SalesforceConnector();

module.exports = salesforceConnector; 