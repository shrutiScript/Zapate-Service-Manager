import { Router } from 'express';
import { AdminController } from './admin.controller.js';
import { authMiddleware } from '../../middleware/authMiddleware.js';
import { requireRoles } from '../../middleware/roleMiddleware.js';

const router = Router();
const controller = new AdminController();

router.use(authMiddleware);
router.use(requireRoles('SUPER_ADMIN'));

// Platform Overview & Audits
router.get('/overview', controller.getOverview);
router.get('/dashboard-stats', controller.getOverview);
router.get('/reports', controller.getSystemReports);
router.get('/system-reports', controller.getSystemReports);
router.get('/login-activity', controller.getLoginActivity);

// Super Admin Activity & Audit Trail
router.get('/activity', controller.getActivityLogs);
router.get('/activity/:id', controller.getActivityLogById);

router.get('/shops/:id', controller.getShopDetails);

// Subscription Plans
router.get('/plans', controller.getPlans);
router.post('/plans', controller.createPlan);
router.patch('/plans/:id', controller.updatePlan);
router.post('/plans/:id/archive', controller.archivePlan);
router.patch('/plans/:id/archive', controller.archivePlan);
router.post('/plans/:id/unarchive', controller.unarchivePlan);
router.patch('/plans/:id/unarchive', controller.unarchivePlan);
router.delete('/plans/:id', controller.deletePlan);

// Global Brands Catalog
router.get('/brands', controller.getBrands);
router.post('/brands', controller.createBrand);
router.patch('/brands/:id', controller.updateBrand);
router.delete('/brands/:id', controller.deleteBrand);

// Global Hardware Categories
router.get('/categories', controller.getCategories);
router.post('/categories', controller.createCategory);

export { router as adminRoutes };
