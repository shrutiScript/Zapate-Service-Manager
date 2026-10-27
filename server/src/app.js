import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import { authRoutes } from './modules/auth/auth.routes.js';
import { userRoutes } from './modules/users/user.routes.js';
import { shopRoutes } from './modules/shops/shop.routes.js';
import { adminRoutes } from './modules/admin/admin.routes.js';
import { customerRoutes } from './modules/customers/customer.routes.js';
import { repairRoutes } from './modules/repairs/repair.routes.js';
import { deviceRoutes } from './modules/devices/device.routes.js';
import { posRoutes } from './modules/pos/pos.routes.js';
import { paymentRoutes } from './modules/payments/payment.routes.js';
import { inventoryRoutes } from './modules/inventory/inventory.routes.js';
import { supplierRoutes } from './modules/suppliers/supplier.routes.js';
import { purchaseRoutes } from './modules/purchases/purchase.routes.js';
import { usedMobileRoutes } from './modules/used-mobiles/usedMobile.routes.js';
import { notificationRoutes } from './modules/notifications/notification.routes.js';
import { reportRoutes } from './modules/reports/report.routes.js';
import { settingsRoutes } from './modules/settings/settings.routes.js';
import { aiRoutes } from './modules/ai/ai.routes.js';
import { warrantyRoutes } from './modules/warranties/warranty.routes.js';
import { planRoutes } from './modules/admin/plan.routes.js';
import { searchRoutes } from './modules/search/search.routes.js';
import { communityRoutes } from './modules/community/community.routes.js';

import { errorMiddleware } from './middleware/errorMiddleware.js';
import { notFoundMiddleware } from './middleware/notFoundMiddleware.js';

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function createApp() {
  const app = express();

  const allowedOrigins = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
  ];

  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin) || origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
          callback(null, true);
        } else {
          callback(null, true);
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    })
  );
  app.use(cookieParser());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Serve static uploads
  app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

  // Built-in request logger
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      console.log(`[HTTP] ${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`);
    });
    next();
  });

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'Zapate Service Manager MERN Stack Engine',
    });
  });

  // Versioned v1 routes
  const v1 = express.Router();
  v1.use('/auth', authRoutes);
  v1.use('/users', userRoutes);
  v1.use('/shops', shopRoutes);
  v1.use('/admin', adminRoutes);
  v1.use('/customers', customerRoutes);
  v1.use('/repairs', repairRoutes);
  v1.use('/devices', deviceRoutes);
  v1.use('/pos', posRoutes);
  v1.use('/payments', paymentRoutes);
  v1.use('/inventory', inventoryRoutes);
  v1.use('/suppliers', supplierRoutes);
  v1.use('/purchases', purchaseRoutes);
  v1.use('/used-mobiles', usedMobileRoutes);
  v1.use('/notifications', notificationRoutes);
  v1.use('/reports', reportRoutes);
  v1.use('/settings', settingsRoutes);
  v1.use('/ai', aiRoutes);
  v1.use('/warranties', warrantyRoutes);
  v1.use('/plans', planRoutes);
  v1.use('/search', searchRoutes);
  v1.use('/community', communityRoutes);

  app.use('/api/v1', v1);
  app.use('/api', v1);

  // 404 & Global Error Middleware
  app.use(notFoundMiddleware);
  app.use(errorMiddleware);

  return app;
}
