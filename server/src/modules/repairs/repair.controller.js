import { RepairService } from './repair.service.js';
import { sendSuccess, sendCreated } from '../../utils/response.js';

const repairService = new RepairService();

export class RepairController {
  async getAll(req, res, next) {
    try {
      const repairs = await repairService.getAll(req.query, req.shopId, req.role);
      return sendSuccess(res, repairs);
    } catch (err) {
      next(err);
    }
  }

  async getById(req, res, next) {
    try {
      const repair = await repairService.getById(req.params.id, req.shopId);
      return sendSuccess(res, repair);
    } catch (err) {
      next(err);
    }
  }

  async create(req, res, next) {
    try {
      const repair = await repairService.create(req.body, req.shopId);
      return sendCreated(res, repair, 'Repair job card initialized successfully');
    } catch (err) {
      next(err);
    }
  }

  async updateStatus(req, res, next) {
    try {
      const repair = await repairService.updateStatus(req.params.id, req.body, req.shopId);
      return sendSuccess(res, repair, 'Repair status updated');
    } catch (err) {
      next(err);
    }
  }

  async revealCredential(req, res, next) {
    try {
      const accessData = await repairService.revealCredential(req.params.id, req.shopId);
      return sendSuccess(res, accessData, 'Credential decrypted successfully');
    } catch (err) {
      next(err);
    }
  }

  async deleteCredential(req, res, next) {
    try {
      const repair = await repairService.deleteCredential(req.params.id, req.shopId);
      return sendSuccess(res, repair, 'Device access credential purged');
    } catch (err) {
      next(err);
    }
  }

  async allocatePart(req, res, next) {
    try {
      const repair = await repairService.allocatePart(req.params.id, req.body, req.shopId);
      return sendSuccess(res, repair, 'Part allocated and stock deducted');
    } catch (err) {
      next(err);
    }
  }

  async generateInvoice(req, res, next) {
    try {
      const result = await repairService.generateInvoice(req.params.id, req.body, req.shopId);
      return sendCreated(res, result, 'Repair invoice generated successfully');
    } catch (err) {
      next(err);
    }
  }

  async delete(req, res, next) {
    try {
      await repairService.delete(req.params.id, req.shopId);
      return sendSuccess(res, null, 'Repair job removed');
    } catch (err) {
      next(err);
    }
  }
}
