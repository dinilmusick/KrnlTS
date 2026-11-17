import 'dotenv/config';
import path from 'path';
import express from 'express';
import { createApp } from './src/server/AppFactory';

async function attachFrontend(app: express.Express) {
  if (process.argv[1]?.endsWith('.ts')) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }
}

async function start() {
  const app = await createApp();
  await attachFrontend(app);
  const PORT = 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

start();
