import { DeviceService } from './device.service.js';
import { sendSuccess, sendCreated } from '../../utils/response.js';

const deviceService = new DeviceService();

export class DeviceController {
  async getAll(req, res, next) {
    try {
      const devices = await deviceService.getAll(req.query.search, req.shopId);
      return sendSuccess(res, devices);
    } catch (err) {
      next(err);
    }
  }

  async getById(req, res, next) {
    try {
      const device = await deviceService.getById(req.params.id, req.shopId);
      return sendSuccess(res, device);
    } catch (err) {
      next(err);
    }
  }

  async create(req, res, next) {
    try {
      const device = await deviceService.create(req.body, req.shopId);
      return sendCreated(res, device, 'Device registered successfully');
    } catch (err) {
      next(err);
    }
  }

  async update(req, res, next) {
    try {
      const device = await deviceService.update(req.params.id, req.body, req.shopId);
      return sendSuccess(res, device, 'Device details updated');
    } catch (err) {
      next(err);
    }
  }

  async delete(req, res, next) {
    try {
      await deviceService.delete(req.params.id, req.shopId);
      return sendSuccess(res, null, 'Device removed');
    } catch (err) {
      next(err);
    }
  }
}
