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

// Body parsers (webhook needs raw body if signature validation is used; here we use token header)
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// CORS with allowlist: allow localhost in dev, *.regalpaw.id in prod unless overridden
const defaultOrigins = config.env !== 'production'
  ? [/^https?:\/\/localhost(?::\d+)?$/, /^https?:\/\/127\.0\.0\.1(?::\d+)?$/]
  : [/\.regalpaw\.id$/];
const corsOrigins = config.allowedOrigins.length ? config.allowedOrigins : defaultOrigins;
app.use(cors({ origin: corsOrigins, credentials: false, allowedHeaders: ['content-type', 'x-api-key'] }));

// Rate limit
app.use(limiter);

// Routes
app.use('/api', router);

// 404 handler
app.use((_req, res) => res.status(404).json({ error: 'Not found' }));

const port = config.port;
app.listen(port, () => {
  console.log(`Payment service listening on port ${port}`);
});
