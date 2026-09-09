import { Router } from 'express';
import { AuthController } from './auth.controller.js';
import { authMiddleware } from '../../middleware/authMiddleware.js';

const router = Router();
const controller = new AuthController();

router.post('/login', controller.login);
router.post('/register', controller.register);
router.post('/logout', controller.logout);
router.get('/me', authMiddleware, controller.getMe);

export { router as authRoutes };
