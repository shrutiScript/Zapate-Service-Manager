import { AdminService } from './admin.service.js';
import { sendSuccess, sendCreated } from '../../utils/response.js';

const adminService = new AdminService();

export class AdminController {
  async getOverview(req, res, next) {
    try {
      const data = await adminService.getOverview();
      return sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  }

  async getLoginActivity(req, res, next) {
    try {
      const data = await adminService.getLoginActivity(req.query);
      return sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  }

  async getActivityLogs(req, res, next) {
    try {
      const data = await adminService.getActivityLogs(req.query);
      return sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  }

  async getActivityLogById(req, res, next) {
    try {
      const data = await adminService.getActivityLogById(req.params.id);
      return sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  }

  async getShopDetails(req, res, next) {
    try {
      const data = await adminService.getShopDetails(req.params.id);
      return sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  }

  async getSystemReports(req, res, next) {
    try {
      const data = await adminService.getSystemReports();
      return sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  }

  async getPlans(req, res, next) {
    try {
      const plans = await adminService.getPlans();
      return sendSuccess(res, plans);
    } catch (err) {
      next(err);
    }
  }

  async getPublicPlans(req, res, next) {
    try {
      const plans = await adminService.getPublicPlans();
      return sendSuccess(res, plans);
    } catch (err) {
      next(err);
    }
  }

  async createPlan(req, res, next) {
    try {
      const plan = await adminService.createPlan(req.body, req);
      return sendCreated(res, plan, 'Subscription plan created');
    } catch (err) {
      next(err);
    }
  }

  async updatePlan(req, res, next) {
    try {
      const plan = await adminService.updatePlan(req.params.id, req.body, req);
      return sendSuccess(res, plan, 'Subscription plan updated');
    } catch (err) {
      next(err);
    }
  }

  async archivePlan(req, res, next) {
    try {
      const plan = await adminService.archivePlan(req.params.id, req);
      return sendSuccess(res, plan, 'Subscription plan archived safely');
    } catch (err) {
      next(err);
    }
  }

  async unarchivePlan(req, res, next) {
    try {
      const plan = await adminService.unarchivePlan(req.params.id, req);
      return sendSuccess(res, plan, 'Subscription plan restored from archive');
    } catch (err) {
      next(err);
    }
  }

  async deletePlan(req, res, next) {
    try {
      await adminService.deletePlan(req.params.id, req);
      return sendSuccess(res, null, 'Subscription plan deleted');
    } catch (err) {
      next(err);
    }
  }

  async getBrands(req, res, next) {
    try {
      const brands = await adminService.getBrands();
      return sendSuccess(res, brands);
    } catch (err) {
      next(err);
    }
  }

  async createBrand(req, res, next) {
    try {
      const brand = await adminService.createBrand(req.body, req);
      return sendCreated(res, brand, 'Brand created');
    } catch (err) {
      next(err);
    }
  }

  async updateBrand(req, res, next) {
    try {
      const brand = await adminService.updateBrand(req.params.id, req.body, req);
      return sendSuccess(res, brand, 'Brand updated');
    } catch (err) {
      next(err);
    }
  }

  async deleteBrand(req, res, next) {
    try {
      await adminService.deleteBrand(req.params.id, req);
      return sendSuccess(res, null, 'Brand deleted');
    } catch (err) {
      next(err);
    }
  }

  async getCategories(req, res, next) {
    try {
      const categories = await adminService.getCategories();
      return sendSuccess(res, categories);
    } catch (err) {
      next(err);
    }
  }

  async createCategory(req, res, next) {
    try {
      const category = await adminService.createCategory(req.body, req);
      return sendCreated(res, category, 'Category created');
    } catch (err) {
      next(err);
    }
  }
}
