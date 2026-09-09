import { Router } from 'express';
import { PosController } from './pos.controller.js';
import { authMiddleware } from '../../middleware/authMiddleware.js';
import { requireModule } from '../../middleware/moduleAccessMiddleware.js';

const router = Router();
const controller = new PosController();

router.use(authMiddleware);
router.use(requireModule('pos'));

router.get('/', controller.getAllInvoices);
router.post('/', controller.createInvoice);
router.get('/invoices', controller.getAllInvoices);
router.get('/invoices/:id', controller.getInvoiceById);
router.post('/invoices', controller.createInvoice);
router.delete('/invoices/:id', controller.deleteInvoice);
router.delete('/:id', controller.deleteInvoice);

export { router as posRoutes };
