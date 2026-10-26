import { Router } from 'express';
import { AuthController } from './auth.controller.js';
import { authMiddleware } from '../../middleware/authMiddleware.js';

const router = Router();
const controller = new AuthController();

router.post('/login', controller.login);
router.post('/register', controller.register);
router.post('/logout', controller.logout);
router.get('/me', authMiddleware, controller.getMe);
router.post('/forgot-password', controller.forgotPassword);
router.post('/verify-reset-otp', controller.verifyResetOtp);
router.post('/reset-password', controller.resetPassword);

export { router as authRoutes };
