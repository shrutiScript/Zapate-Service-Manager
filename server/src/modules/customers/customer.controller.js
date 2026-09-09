import { CustomerService } from './customer.service.js';
import { sendSuccess, sendCreated } from '../../utils/response.js';

const customerService = new CustomerService();

export class CustomerController {
  async getAll(req, res, next) {
    try {
      const customers = await customerService.getAll(req.query.search, req.shopId);
      return sendSuccess(res, customers);
    } catch (err) {
      next(err);
    }
  }

  async getById(req, res, next) {
    try {
      const customer = await customerService.getById(req.params.id, req.shopId);
      return sendSuccess(res, customer);
    } catch (err) {
      next(err);
    }
  }

  async create(req, res, next) {
    try {
      const customer = await customerService.create(req.body, req.shopId);
      return sendCreated(res, customer, 'Customer record created successfully');
    } catch (err) {
      next(err);
    }
  }

  async update(req, res, next) {
    try {
      const customer = await customerService.update(req.params.id, req.body, req.shopId);
      return sendSuccess(res, customer, 'Customer updated successfully');
    } catch (err) {
      next(err);
    }
  }

  async delete(req, res, next) {
    try {
      await customerService.delete(req.params.id, req.shopId);
      return sendSuccess(res, null, 'Customer deleted');
    } catch (err) {
      next(err);
    }
  }
}
