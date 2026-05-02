import { config } from './config.js';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/auth.js';
import roadmapRoutes from './routes/roadmap.js';
import toolsRoutes from './routes/tools.js';

const app = express();

app.disable('x-powered-by');
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(
  cors({
    origin: config.FRONTEND_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  })
);
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

app.get('/api/health', async (_req, res) => {
  const dbOk = mongoose.connection.readyState === 1;
  res.status(dbOk ? 200 : 503).json({ ok: dbOk, db: dbOk ? 'up' : 'down' });
});

app.use('/api/auth', authRoutes);
app.use(
  '/api/roadmap',
  rateLimit({ windowMs: 24 * 60 * 60 * 1000, max: 10, standardHeaders: true, legacyHeaders: false }),
  roadmapRoutes
);
app.use('/api', toolsRoutes);

app.use((err, _req, res, _next) => {
  let status = err.status || (err.name === 'ZodError' ? 400 : 500);
  let message = err.name === 'ZodError' ? 'Invalid request' : err.message || 'Server error';

  if (status === 429 || /rate_?limit/i.test(message)) {
    status = 429;
    if (!message.includes('providers exhausted')) {
      message = `AI rate limit hit: ${message}. Quick fix: rotate one of your free API keys and restart the server.`;
    }
  }

  if (status >= 500) console.error(err);
  res.status(status).json({ error: message });
});

mongoose
  .connect(config.MONGODB_URI)
  .then(() => {
    console.log('mongo connected');
    const server = app.listen(config.PORT, () => console.log(`api listening on :${config.PORT}`));
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`port ${config.PORT} already in use - kill the other server or set PORT in .env`);
      } else {
        console.error('server error:', err);
      }
      mongoose.disconnect().finally(() => process.exit(1));
    });
    const shutdown = (sig) => {
      console.log(`\n${sig} received, closing`);
      server.close(() => mongoose.disconnect().finally(() => process.exit(0)));
    };
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  })
  .catch((e) => {
    console.error('mongo connection failed:', e.message);
    process.exit(1);
  });
