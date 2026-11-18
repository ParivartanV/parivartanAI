import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { authRouter } from './routes/auth.js';
import { syncRouter } from './routes/sync.js';
import { snippetsRouter } from './routes/snippets.js';
import { aiRouter } from './routes/ai.js';
import { adminRouter } from './routes/admin.js';
import { billingRouter } from './routes/billing.js';
import prisma from './prisma.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 4000;

// Serve Admin UI static files
app.use('/admin', express.static(path.join(__dirname, '../public/admin')));

// Enable CORS for Chrome Extensions and Localhost
app.use(cors({
  origin: true, // Allow chrome-extension:// origins and local web apps
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '15mb' }));

// Healthcheck & Welcome
app.get('/', (_req, res) => {
  res.json({
    status: 'online',
    app: 'Parivartan Snippets & AI Tools Central Cloud API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      auth: '/api/auth/google, /api/auth/dev-login, /api/auth/me',
      sync: '/api/sync/pull, /api/sync/push',
      snippets: '/api/snippets',
      ai: '/api/ai/prompts, /api/ai/variables, /api/ai/personas'
    }
  });
});

app.get('/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'healthy', database: 'connected' });
  } catch (err: any) {
    res.status(500).json({ status: 'unhealthy', database: err.message });
  }
});

import { seedMasterAdmin } from './utils/seedMaster.js';

// Mount Routes
app.use('/api/auth', authRouter);
app.use('/api/sync', syncRouter);
app.use('/api/snippets', snippetsRouter);
app.use('/api/ai', aiRouter);
app.use('/api/admin', adminRouter);
app.use('/api/billing', billingRouter);

// Start Server
const server = app.listen(PORT, async () => {
  await seedMasterAdmin();
  console.log(`====================================================`);
  console.log(`🚀 Parivartan Cloud Server running on http://localhost:${PORT}`);
  console.log(`📁 Database: SQLite (dev.db) ready`);
  console.log(`🔑 Auth: Real Google OAuth + Master Email & Password ready`);
  console.log(`⚡ Sync: Pull & Push endpoints ready`);
  console.log(`====================================================`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Shutting down gracefully...');
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
});
