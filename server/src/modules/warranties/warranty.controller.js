import { WarrantyService } from './warranty.service.js';
import { sendSuccess, sendCreated } from '../../utils/response.js';

const service = new WarrantyService();

export class WarrantyController {
  async getAll(req, res, next) {
    try {
      const warranties = await service.getAll(req.query.search, req.query.status, req.shopId);
      return sendSuccess(res, warranties);
    } catch (err) {
      next(err);
    }
  }

  async getById(req, res, next) {
    try {
      const warranty = await service.getById(req.params.id, req.shopId);
      return sendSuccess(res, warranty);
    } catch (err) {
      next(err);
    }
  }

  async createFromRepair(req, res, next) {
    try {
      const warranty = await service.createFromRepair(req.params.repairId, req.body, req.shopId);
      return sendCreated(res, warranty, 'Warranty certificate generated successfully');
    } catch (err) {
      next(err);
    }
  }

  async update(req, res, next) {
    try {
      const warranty = await service.update(req.params.id, req.body, req.shopId);
      return sendSuccess(res, warranty, 'Warranty configuration updated');
    } catch (err) {
      next(err);
    }
  }

  async voidWarranty(req, res, next) {
    try {
      const warranty = await service.voidWarranty(req.params.id, req.body.reason, req.shopId);
      return sendSuccess(res, warranty, 'Warranty marked as VOID');
    } catch (err) {
      next(err);
    }
  }
}
