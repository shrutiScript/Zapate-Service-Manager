import { createApp } from './app.js';
import { connectDB } from './config/db.js';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 5000;

export async function startServer() {
  const app = createApp();

  await connectDB();

  // Start periodic subscription expiry background sweeper (runs every 60 seconds)
  const { checkAndExpireSubscriptions } = await import('./modules/shops/subscription.service.js');
  setInterval(checkAndExpireSubscriptions, 60000);
  // Run once immediately on startup
  checkAndExpireSubscriptions().catch(() => {});

  const server = app.listen(PORT, () => {
    console.log(`[Zapate Service Manager Server] Running on http://localhost:${PORT}`);
    console.log(`[Zapate Service Manager API] Versioned endpoints at http://localhost:${PORT}/api/v1`);
  });

  return { app, server };
}

startServer().catch((err) => {
  console.error('[Zapate Service Manager Server] Failed to start:', err);
});
