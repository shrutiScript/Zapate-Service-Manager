import { createApp } from './app.js';
import { connectDB } from './config/db.js';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 5000;

export async function startServer() {
  const app = createApp();

  await connectDB();

  const server = app.listen(PORT, () => {
    console.log(`[Zapate Service Manager Server] Running on http://localhost:${PORT}`);
    console.log(`[Zapate Service Manager API] Versioned endpoints at http://localhost:${PORT}/api/v1`);
  });

  return { app, server };
}

startServer().catch((err) => {
  console.error('[Zapate Service Manager Server] Failed to start:', err);
});
