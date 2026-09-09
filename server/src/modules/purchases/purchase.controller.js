import { PurchaseService } from './purchase.service.js';
import { sendSuccess, sendCreated } from '../../utils/response.js';

const purchaseService = new PurchaseService();

export class PurchaseController {
  async getAll(req, res, next) {
    try {
      const purchases = await purchaseService.getAll(req.shopId);
      return sendSuccess(res, purchases);
    } catch (err) {
      next(err);
    }
  }

  async getById(req, res, next) {
    try {
      const purchase = await purchaseService.getById(req.params.id, req.shopId);
      return sendSuccess(res, purchase);
    } catch (err) {
      next(err);
    }
  }

  async create(req, res, next) {
    try {
      const purchase = await purchaseService.create(req.body, req.shopId);
      return sendCreated(res, purchase, 'Purchase order recorded and stock automatically incremented');
    } catch (err) {
      next(err);
    }
  }
}
