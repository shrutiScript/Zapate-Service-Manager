import { PaymentService } from './payment.service.js';
import { sendSuccess, sendCreated } from '../../utils/response.js';

const paymentService = new PaymentService();

export class PaymentController {
  async getLedger(req, res, next) {
    try {
      const ledger = await paymentService.getLedger(req.query, req.shopId);
      return sendSuccess(res, ledger);
    } catch (err) {
      next(err);
    }
  }

  async recordPayment(req, res, next) {
    try {
      const entry = await paymentService.recordPayment(req.body, req.shopId);
      return sendCreated(res, entry, 'Payment transaction recorded successfully');
    } catch (err) {
      next(err);
    }
  }

  async receiveInvoicePayment(req, res, next) {
    try {
      const staffName = req.user?.name || 'Staff';
      const result = await paymentService.receiveInvoicePayment(req.body, req.shopId, staffName);
      return sendCreated(res, result, 'Invoice payment received successfully');
    } catch (err) {
      next(err);
    }
  }

  async getInvoicePaymentHistory(req, res, next) {
    try {
      const history = await paymentService.getInvoicePaymentHistory(req.params.invoiceId, req.shopId);
      return sendSuccess(res, history);
    } catch (err) {
      next(err);
    }
  }

  async getPaymentByReceiptNumber(req, res, next) {
    try {
      const payment = await paymentService.getPaymentByReceiptNumber(req.params.receiptNumber, req.shopId);
      return sendSuccess(res, payment);
    } catch (err) {
      next(err);
    }
  }

  async getDueSummary(req, res, next) {
    try {
      const summary = await paymentService.getDueSummary(req.shopId);
      return sendSuccess(res, summary);
    } catch (err) {
      next(err);
    }
  }
}

