import { UsedMobileService } from './usedMobile.service.js';
import { sendSuccess, sendCreated } from '../../utils/response.js';

const usedMobileService = new UsedMobileService();

export class UsedMobileController {
  async getAll(req, res, next) {
    try {
      const mobiles = await usedMobileService.getAll(req.query, req.shopId);
      return sendSuccess(res, mobiles);
    } catch (err) {
      next(err);
    }
  }

  async getById(req, res, next) {
    try {
      const mobile = await usedMobileService.getById(req.params.id, req.shopId);
      return sendSuccess(res, mobile);
    } catch (err) {
      next(err);
    }
  }

  async create(req, res, next) {
    try {
      const mobile = await usedMobileService.create(req.body, req.shopId);
      return sendCreated(res, mobile, 'Used mobile inventory logged successfully');
    } catch (err) {
      next(err);
    }
  }

  async update(req, res, next) {
    try {
      const mobile = await usedMobileService.update(req.params.id, req.body, req.shopId);
      return sendSuccess(res, mobile, 'Used mobile updated');
    } catch (err) {
      next(err);
    }
  }

  async sell(req, res, next) {
    try {
      const mobile = await usedMobileService.sell(req.params.id, req.body, req.shopId);
      return sendSuccess(res, mobile, 'Used mobile sold successfully');
    } catch (err) {
      next(err);
    }
  }

  async delete(req, res, next) {
    try {
      await usedMobileService.delete(req.params.id, req.shopId);
      return sendSuccess(res, null, 'Used mobile record removed');
    } catch (err) {
      next(err);
    }
  }
}
