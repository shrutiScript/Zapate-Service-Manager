import { InventoryService } from './inventory.service.js';
import { sendSuccess, sendCreated } from '../../utils/response.js';

const inventoryService = new InventoryService();

export class InventoryController {
  async getAll(req, res, next) {
    try {
      const items = await inventoryService.getAll(req.query, req.shopId);
      return sendSuccess(res, items);
    } catch (err) {
      next(err);
    }
  }

  async getById(req, res, next) {
    try {
      const item = await inventoryService.getById(req.params.id, req.shopId);
      return sendSuccess(res, item);
    } catch (err) {
      next(err);
    }
  }

  async create(req, res, next) {
    try {
      const item = await inventoryService.create(req.body, req.shopId);
      return sendCreated(res, item, 'Inventory item added');
    } catch (err) {
      next(err);
    }
  }

  async update(req, res, next) {
    try {
      const item = await inventoryService.update(req.params.id, req.body, req.shopId);
      return sendSuccess(res, item, 'Inventory item updated');
    } catch (err) {
      next(err);
    }
  }

  async adjustStock(req, res, next) {
    try {
      const item = await inventoryService.adjustStock(req.params.id, req.body, req.shopId);
      return sendSuccess(res, item, 'Stock level adjusted');
    } catch (err) {
      next(err);
    }
  }

  async delete(req, res, next) {
    try {
      await inventoryService.delete(req.params.id, req.shopId);
      return sendSuccess(res, null, 'Inventory item removed');
    } catch (err) {
      next(err);
    }
  }
}
