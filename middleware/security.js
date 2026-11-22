
const helmet = require('helmet');
const cors = require('cors');

const allowedOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);

function securityMiddleware(app) {
  app.disable('x-powered-by');

  if (process.env.TRUST_PROXY) {
    // Use an explicit hop count or trusted proxy list. Never trust every proxy by default.
    app.set('trust proxy', process.env.TRUST_PROXY);
  }

  app.use(helmet());

  app.use(cors({
    origin(origin, callback) {
      // Native mobile clients may not send Origin.
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      if (
        process.env.NODE_ENV !== 'production' &&
        ['http://localhost:8081', 'http://localhost:19006']
          .includes(origin)
      ) {
        return callback(null, true);
      }

      return callback(null, false);
    },

    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],

    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Request-ID',
    ],

    credentials: false,
    maxAge: 600,
  }));

  app.use((req, res, next) => {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    next();
  });
}

module.exports = securityMiddleware;
