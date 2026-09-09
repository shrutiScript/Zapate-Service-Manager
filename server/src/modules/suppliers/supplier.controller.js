import { SupplierService } from './supplier.service.js';
import { sendSuccess, sendCreated } from '../../utils/response.js';

const supplierService = new SupplierService();

export class SupplierController {
  async getAll(req, res, next) {
    try {
      const suppliers = await supplierService.getAll(req.query.search, req.shopId);
      return sendSuccess(res, suppliers);
    } catch (err) {
      next(err);
    }
  }

  async getById(req, res, next) {
    try {
      const supplier = await supplierService.getById(req.params.id, req.shopId);
      return sendSuccess(res, supplier);
    } catch (err) {
      next(err);
    }
  }

  async create(req, res, next) {
    try {
      const supplier = await supplierService.create(req.body, req.shopId);
      return sendCreated(res, supplier, 'Supplier account created successfully');
    } catch (err) {
      next(err);
    }
  }

  async update(req, res, next) {
    try {
      const supplier = await supplierService.update(req.params.id, req.body, req.shopId);
      return sendSuccess(res, supplier, 'Supplier details updated');
    } catch (err) {
      next(err);
    }
  }

  async delete(req, res, next) {
    try {
      await supplierService.delete(req.params.id, req.shopId);
      return sendSuccess(res, null, 'Supplier removed');
    } catch (err) {
      next(err);
    }
  }
}
