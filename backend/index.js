import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { randomUUID } from 'node:crypto';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { env, assertServerConfiguration } from './src/config/env.js';
import { pool } from './src/config/db.js';
import { mainRouter } from './src/api/routes.js';
import { requireTrustedOrigin } from './src/middleware/csrf.js';
import { notFound } from './src/middleware/not-found.js';
import { errorHandler } from './src/middleware/error-handler.js';
import { startAuthTableCleanup } from './src/shared/auth/cleanup.js';
import { logInfo } from './src/utils/log.js';

export const app = express();
app.disable('x-powered-by');
app.set('trust proxy', env.trustProxy);

app.use((req, res, next) => {
  req.id = randomUUID();
  res.set('X-Request-ID', req.id);
  next();
});
app.use(helmet());
app.use(cors({ origin: env.corsOrigin, credentials: true }));
app.use(express.json({ limit: '256kb' }));
app.use(cookieParser());
app.use(requireTrustedOrigin);

app.use('/api', mainRouter);
app.use(notFound);
app.use(errorHandler);

export function startServer() {
  assertServerConfiguration();
  const server = app.listen(env.port, () =>
    logInfo({ event: 'server_started', port: env.port, node_env: env.nodeEnv }),
  );
  const stopCleanup = startAuthTableCleanup();

  let closing = false;
  const shutdown = () => {
    if (closing) return;
    closing = true;
    stopCleanup();
    const forceExit = setTimeout(() => process.exit(1), 10000);
    forceExit.unref();
    server.close(async () => {
      try {
        await pool.end();
        clearTimeout(forceExit);
        process.exit(0);
      } catch {
        process.exit(1);
      }
    });
  };
  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);
  return server;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) startServer();
