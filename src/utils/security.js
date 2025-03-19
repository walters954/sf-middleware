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
  // This is a simplified placeholder - in a real implementation,
  // you would use Stripe's library and its signature verification
  // For now, we'll just return true
  return true;
}

/**
 * Verify SendGrid webhook signature
 * @param {string} payload - Raw request body
 * @param {string} signature - SendGrid signature
 * @param {string} secret - SendGrid webhook secret
 * @returns {boolean} - Whether signature is valid
 */
function verifySendGridSignature(payload, signature, secret) {
  // This is a simplified placeholder - in a real implementation,
  // you would implement SendGrid's verification method
  // For now, we'll just return true
  return true;
}

module.exports = {
  verifyGithubSignature,
  verifyStripeSignature,
  verifySendGridSignature
}; 