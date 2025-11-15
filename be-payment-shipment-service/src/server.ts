import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import router from './routes/index';
import { config } from './config';
import { limiter } from './security';

const app = express();

// Trust proxy only in production and only the first hop (e.g., Nginx/Cloudflare)
app.set('trust proxy', config.env === 'production' ? 1 : false);

// Basic security & utilities
app.use(helmet());
app.use(morgan(config.env === 'production' ? 'combined' : 'dev'));

// Body parsers
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// CORS
const defaultOrigins = config.env !== 'production'
  ? [/^https?:\/\/localhost(?::\d+)?$/, /^https?:\/\/127\.0\.0\.1(?::\d+)?$/]
  : [/\.regalpaw\.id$/];
const corsOrigins = config.allowedOrigins.length ? config.allowedOrigins : defaultOrigins;
app.use(cors({ origin: corsOrigins, credentials: false, allowedHeaders: ['content-type', 'x-api-key'] }));

// Rate limit
app.use(limiter);

// Health check endpoint (simple)
app.get('/health', (_req, res) => {
  res.status(200).json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: Math.round(process.uptime()),
  });
});

// Routes
app.use('/api', router);

// 404 handler
app.use((_req, res) => res.status(404).json({ error: 'Not found' }));

// Use PORT from environment
const port = parseInt(process.env.PORT || String(config.port || 3000), 10);

const server = app.listen(port, '0.0.0.0', () => {
  console.log(`✅ Payment service listening on port ${port}`);
  console.log(`📦 Environment: ${config.env}`);
  console.log(`⏰ Started at: ${new Date().toISOString()}`);
});

// Graceful shutdown
const gracefulShutdown = (signal: string) => {
  console.log(`\n${signal} received: closing server`);
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
  
  setTimeout(() => {
    console.error('⚠️ Forced shutdown');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});
process.on('unhandledRejection', (reason) => {
  console.error('❌ Unhandled Rejection:', reason);
});
