import { Router } from 'express';
import { CommunityController } from './community.controller.js';
import { authMiddleware } from '../../middleware/authMiddleware.js';
import { requireModule } from '../../middleware/moduleAccessMiddleware.js';

const router = Router();
const controller = new CommunityController();

router.use(authMiddleware);
router.use(requireModule('community'));

router.get('/posts', controller.getPosts);
router.post('/posts', controller.createPost);
router.post('/posts/:id/like', controller.toggleLike);
router.post('/posts/:id/comments', controller.addComment);
router.post('/posts/:id/comments/:commentId/like', controller.toggleCommentLike);
router.post('/posts/:id/save', controller.toggleSave);

export { router as communityRoutes };
