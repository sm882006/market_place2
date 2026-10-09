import express from 'express';
import cors from 'cors';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { config } from './config/env.js';
import routes from './routes/index.js';
import { notFound, errorHandler } from './middleware/error.middleware.js';

export function createApp() {
  const app = express();
  app.use(cors({ origin: config.corsOrigin }));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use((req, res, next) => { req.body ??= {}; next(); });
  app.use(routes);
  app.use('/api', notFound);
  if (existsSync(join(config.distDir, 'index.html'))) {
    app.use(express.static(config.distDir));
    app.use((req, res, next) => {
      if (req.method !== 'GET' || !req.accepts('html')) return next();
      res.sendFile('index.html', { root: config.distDir });
    });
  }
  app.use(notFound);
  app.use(errorHandler);
  return app;
}
