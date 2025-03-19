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