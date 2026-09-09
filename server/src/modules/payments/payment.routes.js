import { Router } from 'express';
import { PaymentController } from './payment.controller.js';
import { authMiddleware } from '../../middleware/authMiddleware.js';
import { requireModule } from '../../middleware/moduleAccessMiddleware.js';

const router = Router();
const controller = new PaymentController();

router.use(authMiddleware);
router.use(requireModule('payments'));

router.get('/', controller.getLedger);
router.post('/', controller.recordPayment);
router.get('/ledger', controller.getLedger);
router.post('/record', controller.recordPayment);

router.post('/receive', controller.receiveInvoicePayment);
router.get('/invoice/:invoiceId', controller.getInvoicePaymentHistory);
router.get('/receipt/:receiptNumber', controller.getPaymentByReceiptNumber);
router.get('/due-summary', controller.getDueSummary);


export { router as paymentRoutes };
