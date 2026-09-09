import { PosService } from './pos.service.js';
import { sendSuccess, sendCreated } from '../../utils/response.js';

const posService = new PosService();

export class PosController {
  async getAllInvoices(req, res, next) {
    try {
      const invoices = await posService.getAllInvoices(req.query, req.shopId);
      return sendSuccess(res, invoices);
    } catch (err) {
      next(err);
    }
  }

  async getInvoiceById(req, res, next) {
    try {
      const invoice = await posService.getInvoiceById(req.params.id, req.shopId);
      return sendSuccess(res, invoice);
    } catch (err) {
      next(err);
    }
  }

  async createInvoice(req, res, next) {
    try {
      const invoice = await posService.createInvoice(req.body, req.shopId);
      return sendCreated(res, invoice, 'Invoice generated and inventory updated');
    } catch (err) {
      next(err);
    }
  }

  async deleteInvoice(req, res, next) {
    try {
      await posService.deleteInvoice(req.params.id, req.shopId);
      return sendSuccess(res, null, 'Invoice deleted successfully');
    } catch (err) {
      next(err);
    }
  }
}
