import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config, chatEnabled, embeddingEnabled, publicConfig } from './config.js';
import aiRouter from './routes/ai.js';
import { ragStats } from './rag.js';

const LOCAL_ORIGIN = /^https?:\/\/(localhost|127\.0\.0\.1|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)(:\d+)?$/;

function isAllowedOrigin(origin) {
  if (!origin) return true;
  if (config.corsOrigins.includes(origin)) return true;
  if (origin === 'https://localhost' || origin === 'capacitor://localhost') return true;
  return LOCAL_ORIGIN.test(origin);
}

export const app = express();

app.set('trust proxy', 1);
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
app.use(cors({
  origin(origin, callback) {
    callback(null, isAllowedOrigin(origin));
  },
}));
app.use(express.json({ limit: '12mb' }));

app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    ...publicConfig(),
    rag: ragStats(),
    time: new Date().toISOString(),
  });
});

app.use('/api', aiRouter);

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Not found' });
});

app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  const status = Number(error.status) || 500;
  if (status >= 500) console.error('[Server]', error.message);
  res.status(status).json({
    success: false,
    message: error.message || '服务器内部错误',
    code: error.code || 'internal_error',
  });
});

export function start(port = config.port) {
  return app.listen(port, () => {
    console.log('[Server] Offer Catcher AI proxy');
    console.log('[Server] http://localhost:' + port);
    console.log('[Server] chat:', chatEnabled() ? config.chat.model : 'DISABLED');
    console.log('[Server] embedding:', embeddingEnabled() ? config.embedding.model : 'DISABLED');
    console.log('[Server] rag chunks:', ragStats().chunks);
  });
}

const isMain = process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;
if (isMain) {
  start();
}
