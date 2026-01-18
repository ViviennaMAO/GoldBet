// server/src/index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const cron = require('node-cron');

// Import routes
const authRoutes = require('./routes/auth');
const priceRoutes = require('./routes/prices');
const predictionRoutes = require('./routes/predictions');
const userRoutes = require('./routes/users');
const leaderboardRoutes = require('./routes/leaderboard');

// Import services
const priceService = require('./services/priceService');
const settlementService = require('./services/settlementService');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/prices', priceRoutes);
app.use('/api/predictions', predictionRoutes);
app.use('/api/users', userRoutes);
app.use('/api/leaderboard', leaderboardRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error'
  });
});

// Database connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => {
    console.log('✓ Connected to MongoDB');
    startServer();
  })
  .catch(err => {
    console.error('✗ MongoDB connection error:', err);
    process.exit(1);
  });

// Start server
function startServer() {
  app.listen(PORT, () => {
    console.log(`✓ Server running on port ${PORT}`);
    console.log(`✓ Environment: ${process.env.NODE_ENV}`);
    setupCronJobs();
  });
}

// Setup cron jobs
function setupCronJobs() {
  // Price update job - every 15 minutes
  const priceUpdateInterval = process.env.PRICE_UPDATE_INTERVAL || '*/15 * * * *';
  cron.schedule(priceUpdateInterval, async () => {
    console.log('Running price update job...');
    try {
      await priceService.fetchAndSavePrice();
      console.log('Price update completed');
    } catch (error) {
      console.error('Price update failed:', error);
    }
  });

  // Settlement check job - every hour
  const settlementCheckInterval = process.env.SETTLEMENT_CHECK_INTERVAL || '0 * * * *';
  cron.schedule(settlementCheckInterval, async () => {
    console.log('Running settlement check job...');
    try {
      await settlementService.checkAndSettle();
      console.log('Settlement check completed');
    } catch (error) {
      console.error('Settlement check failed:', error);
    }
  });

  console.log('✓ Cron jobs scheduled');
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  mongoose.connection.close(() => {
    console.log('MongoDB connection closed');
    process.exit(0);
  });
});

module.exports = app;
