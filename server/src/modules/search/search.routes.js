import { Router } from 'express';
import { SearchController } from './search.controller.js';
import { authMiddleware } from '../../middleware/authMiddleware.js';

const router = Router();
const controller = new SearchController();

// Omni-search is available to all authenticated users (both Shop Owners and Super Admins)
router.use(authMiddleware);

router.get('/', controller.omniSearch);

export { router as searchRoutes };
