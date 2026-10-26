import { Router } from 'express';
import { AdminController } from './admin.controller.js';

const router = Router();
const controller = new AdminController();

// Publicly accessible endpoints for pricing cards and landing page
router.get('/', controller.getPublicPlans);
router.get('/public', controller.getPublicPlans);

export { router as planRoutes };
