
require('dotenv').config();

const express = require('express');

const initializeDatabase = require('./database/initialize');
const securityMiddleware = require('./middleware/security');

const {
  generalLimiter,
} = require('./middleware/rateLimiter');

const {
  notFoundHandler,
  errorHandler,
} = require('./middleware/errorHandler');

const pool = require('./config/database');

const authRoutes = require('./routes/authroutes');

const app = express();

if (!Number.isInteger(Number(process.env.PORT || 5000)) || Number(process.env.PORT || 5000) < 1 || Number(process.env.PORT || 5000) > 65535) {
  throw new Error('PORT must be a valid TCP port.');
}

securityMiddleware(app);

app.use(express.json({
  limit: '20kb',
}));

app.use(express.urlencoded({
  extended: false,
  limit: '20kb',
}));

app.use('/api', generalLimiter);

// Application status
app.get('/', (req, res) => {
  res.json({
    success: true,
    application: 'Ulagu',
    status: 'online',
    message: 'Ulagu Backend API is running',
  });
});

// Actual database health check
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');

    res.status(200).json({
      success: true,
      application: 'Ulagu',
      status: 'healthy',
      database: 'connected',
    });
  } catch (error) {
    console.error('Health check failed:', error.message);

    res.status(503).json({
      success: false,
      status: 'unhealthy',
      database: 'unavailable',
    });
  }
});

// Existing authentication routes
app.use('/api/auth', authRoutes);

// Unknown endpoints
app.use(notFoundHandler);

// Centralized errors
app.use(errorHandler);

const PORT = Number(process.env.PORT || 5000);

let server;

async function startServer() {
  try {
    console.log('Starting Ulagu backend...');

    await initializeDatabase();

    server = app.listen(PORT, '0.0.0.0', () => {
      console.log('--------------------------------');
      console.log('ULAGU BACKEND STARTED');
      console.log('--------------------------------');
      console.log(`Port: ${PORT}`);
      console.log(`URL: http://localhost:${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log('--------------------------------');
    });

  } catch (error) {
    console.error('Unable to start Ulagu backend:', error.message);

    await pool.end().catch(() => {});

    process.exit(1);
  }
}

async function shutdown(signal) {
  console.log(`${signal} received. Shutting down Ulagu...`);

  if (server) {
    server.close(async () => {
      try {
        await pool.end();
        console.log('Database connection closed.');
        process.exit(0);
      } catch (error) {
        console.error('Shutdown error:', error.message);
        process.exit(1);
      }
    });
  } else {
    await pool.end().catch(() => {});
    process.exit(0);
  }
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

startServer();

module.exports = app;
