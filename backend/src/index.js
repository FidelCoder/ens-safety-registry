require('dotenv').config();
const express = require('express');
const cors = require('cors');
const NodeCache = require('node-cache');
const reportRoutes = require('./routes/reports');
const checkRoutes = require('./routes/check');

const app = express();
const PORT = process.env.PORT || 3001;

// Cache for 5 minutes
const cache = new NodeCache({ stdTTL: 300 });

// Middleware
app.use(cors());
app.use(express.json());

// Make cache available to routes
app.set('cache', cache);

// Routes
app.use('/api/reports', reportRoutes);
app.use('/api/check', checkRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'ENS Safety Registry API',
    version: '0.1.0',
    endpoints: {
      check: '/api/check/:address',
      reports: '/api/reports',
      submit: '/api/reports (POST)',
      health: '/health'
    }
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`🛡️  ENS Safety Registry API running on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/health`);
});

module.exports = app;
