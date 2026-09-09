import { ShopService } from './shop.service.js';
import { sendSuccess, sendCreated } from '../../utils/response.js';

const shopService = new ShopService();

export class ShopController {
  async getAll(req, res, next) {
    try {
      const shops = await shopService.getAll(req.query);
      return sendSuccess(res, shops);
    } catch (err) {
      next(err);
    }
  }

  async getById(req, res, next) {
    try {
      const shopId = req.role === 'SHOP_OWNER' ? req.shopId : req.params.id;
      const shop = await shopService.getById(shopId);
      return sendSuccess(res, shop);
    } catch (err) {
      next(err);
    }
  }

  async create(req, res, next) {
    try {
      const shop = await shopService.create(req.body, req);
      return sendCreated(res, shop, 'Workshop created successfully');
    } catch (err) {
      next(err);
    }
  }

  async completeSetup(req, res, next) {
    try {
      const shopId = req.shopId;
      if (!shopId) {
        return res
          .status(403)
          .json({ success: false, message: 'Unauthorized. Only Shop Owners can complete setup.' });
      }
      const shop = await shopService.completeShopSetup(shopId, req.body);
      return sendSuccess(res, shop, 'Shop setup completed successfully');
    } catch (err) {
      next(err);
    }
  }

  async update(req, res, next) {
    try {
      const shopId = req.role === 'SHOP_OWNER' ? req.shopId : req.params.id;
      const shop = await shopService.update(shopId, req.body, req);
      return sendSuccess(res, shop, 'Shop details updated successfully');
    } catch (err) {
      next(err);
    }
  }

  async blockWorkshop(req, res, next) {
    try {
      const { reason } = req.body || {};
      const shop = await shopService.blockWorkshop(req.params.id, reason, req);
      return sendSuccess(
        res,
        shop,
        `Workshop "${shop.name}" has been blocked. All active sessions have been invalidated.`
      );
    } catch (err) {
      next(err);
    }
  }

  async unblockWorkshop(req, res, next) {
    try {
      const { reason } = req.body || {};
      const shop = await shopService.unblockWorkshop(req.params.id, reason, req);
      return sendSuccess(
        res,
        shop,
        `Workshop "${shop.name}" has been unblocked. Login access has been restored.`
      );
    } catch (err) {
      next(err);
    }
  }

  async delete(req, res, next) {
    try {
      const { reason } = req.body || {};
      await shopService.delete(req.params.id, reason, req);
      return sendSuccess(res, null, 'Shop deleted successfully');
    } catch (err) {
      next(err);
    }
  }
}
