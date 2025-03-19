const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');

// Import integrations
const githubIntegration = require('../integrations/github');
const sendgridIntegration = require('../integrations/sendgrid');
const stripeIntegration = require('../integrations/stripe');

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

// SendGrid webhook endpoint
router.post('/sendgrid', async (req, res) => {
  try {
    // Verify webhook signature
    if (!sendgridIntegration.verifyRequest(req)) {
      return res.status(401).json({ error: 'Invalid signature' });
    }
    
    // Process the webhook data
    const data = {
      ...req.body,
      headers: req.headers
    };
    
    // Process asynchronously and respond immediately to SendGrid
    res.status(202).json({ status: 'processing' });
    
    // Now process the data
    await sendgridIntegration.process(data);
    logger.info('SendGrid webhook processed successfully');
  } catch (error) {
    logger.error(`Error processing SendGrid webhook: ${error.message}`);
    // We've already responded to SendGrid, so we just log the error
  }
});

// Stripe webhook endpoint
router.post('/stripe', async (req, res) => {
  try {
    // Verify webhook signature
    if (!stripeIntegration.verifyRequest(req)) {
      return res.status(401).json({ error: 'Invalid signature' });
    }
    
    // Process the webhook data
    const data = {
      ...req.body,
      headers: req.headers
    };
    
    // Process asynchronously and respond immediately to Stripe
    res.status(202).json({ status: 'processing' });
    
    // Now process the data
    await stripeIntegration.process(data);
    logger.info('Stripe webhook processed successfully');
  } catch (error) {
    logger.error(`Error processing Stripe webhook: ${error.message}`);
    // We've already responded to Stripe, so we just log the error
  }
});

module.exports = router; 