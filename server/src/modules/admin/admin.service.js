import { Shop } from '../shops/shop.model.js';
import { User } from '../users/user.model.js';
import { LoginActivity } from './loginActivity.model.js';
import { Plan } from './plan.model.js';
import { GlobalBrand } from './globalBrand.model.js';
import { GlobalCategory } from './globalCategory.model.js';
import { auditLogService } from './auditLog.service.js';

export class AdminService {
  async getOverview() {
    const totalShops = await Shop.countDocuments();
    const totalShopOwners = await User.countDocuments({ role: 'SHOP_OWNER' });
    const totalLoginCount = await LoginActivity.countDocuments();

    // Today's login count
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayLoginCount = await LoginActivity.countDocuments({
      loginAt: { $gte: today },
    });

    const recentShops = await Shop.find().sort({ createdAt: -1 }).limit(5);
    const recentLogins = await LoginActivity.find().sort({ loginAt: -1 }).limit(8);
    const recentActions = await auditLogService.getRecentAdminActions(8);

    // KPI Metrics for Dashboard
    const past30Days = new Date(today);
    past30Days.setDate(past30Days.getDate() - 30);

    const [todayActions, blockedWorkshops, newWorkshops, securityActions] = await Promise.all([
      auditLogService.getActivityLogs({ dateRange: 'today', limit: 1 }),
      Shop.countDocuments({ status: 'BLOCKED' }),
      Shop.countDocuments({ createdAt: { $gte: past30Days } }),
      auditLogService.getActivityLogs({ category: 'Security', limit: 1 }),
    ]);

    return {
      stats: {
        totalShops,
        totalShopOwners,
        totalLoginCount,
        todayLoginCount,
        todayActions: todayActions?.pagination?.total || 0,
        blockedWorkshops,
        newWorkshops,
        securityActions: securityActions?.pagination?.total || 0,
      },
      recentShops,
      recentLogins,
      recentActions,
    };
  }

  async getLoginActivity(query = {}) {
    const filter = {};
    if (query.shopId) filter.shopId = query.shopId;
    if (query.role) filter.role = query.role;
    if (query.search) {
      filter.$or = [
        { userName: { $regex: query.search, $options: 'i' } },
        { shopName: { $regex: query.search, $options: 'i' } },
        { email: { $regex: query.search, $options: 'i' } },
      ];
    }
    return LoginActivity.find(filter).sort({ loginAt: -1 }).limit(100);
  }

  async getShopDetails(id) {
    const shop = await Shop.findById(id);
    if (!shop) throw new Error('Shop not found');
    const owner = await User.findOne({ shopId: shop._id, role: 'SHOP_OWNER' }).select('-password');
    const recentLogins = await LoginActivity.find({ shopId: shop._id }).sort({ loginAt: -1 }).limit(10);
    return {
      shop,
      owner,
      recentLogins,
    };
  }

  // Audit Activity Logs
  async getActivityLogs(query = {}) {
    return auditLogService.getActivityLogs(query);
  }

  async getActivityLogById(id) {
    return auditLogService.getActivityLogById(id);
  }

  // Plans Management
  async getPlans() {
    return Plan.find().sort({ price: 1 });
  }

  async createPlan(data, req = null) {
    const plan = await Plan.create(data);

    if (req && req.user?.role === 'SUPER_ADMIN') {
      auditLogService.recordActivity({
        req,
        action: 'PLAN_CREATED',
        category: 'Subscription',
        targetType: 'Subscription Plan',
        targetId: plan._id,
        targetName: plan.name,
        newData: plan,
        reason: data.reason || 'New subscription plan created by Super Admin',
      });
    }

    return plan;
  }

  async updatePlan(id, data, req = null) {
    const previous = await Plan.findById(id);
    if (!previous) throw new Error('Plan not found');

    const updated = await Plan.findByIdAndUpdate(id, data, { new: true });

    if (req && req.user?.role === 'SUPER_ADMIN') {
      auditLogService.recordActivity({
        req,
        action: 'PLAN_UPDATED',
        category: 'Subscription',
        targetType: 'Subscription Plan',
        targetId: updated._id,
        targetName: updated.name,
        previousData: previous,
        newData: updated,
        reason: data.reason || 'Subscription plan configuration updated',
      });
    }

    return updated;
  }

  async deletePlan(id, req = null) {
    const previous = await Plan.findById(id);
    if (!previous) throw new Error('Plan not found');

    await Plan.findByIdAndDelete(id);

    if (req && req.user?.role === 'SUPER_ADMIN') {
      auditLogService.recordActivity({
        req,
        action: 'PLAN_DELETED',
        category: 'Subscription',
        targetType: 'Subscription Plan',
        targetId: previous._id,
        targetName: previous.name,
        previousData: previous,
        reason: req.body?.reason || 'Subscription plan deleted',
      });
    }

    return true;
  }

  // Global Brands & Categories
  async getBrands() {
    return GlobalBrand.find().sort({ name: 1 });
  }

  async createBrand(data, req = null) {
    const brand = await GlobalBrand.create(data);

    if (req && req.user?.role === 'SUPER_ADMIN') {
      auditLogService.recordActivity({
        req,
        action: 'BRAND_CREATED',
        category: 'Brand',
        targetType: 'Brand',
        targetId: brand._id,
        targetName: brand.name,
        newData: brand,
        reason: data.reason || 'Global smartphone brand added',
      });
    }

    return brand;
  }

  async updateBrand(id, data, req = null) {
    const previous = await GlobalBrand.findById(id);
    if (!previous) throw new Error('Brand not found');

    const updated = await GlobalBrand.findByIdAndUpdate(id, data, { new: true });

    if (req && req.user?.role === 'SUPER_ADMIN') {
      auditLogService.recordActivity({
        req,
        action: 'BRAND_UPDATED',
        category: 'Brand',
        targetType: 'Brand',
        targetId: updated._id,
        targetName: updated.name,
        previousData: previous,
        newData: updated,
        reason: data.reason || 'Global brand updated',
      });
    }

    return updated;
  }

  async deleteBrand(id, req = null) {
    const previous = await GlobalBrand.findById(id);
    if (!previous) throw new Error('Brand not found');

    await GlobalBrand.findByIdAndDelete(id);

    if (req && req.user?.role === 'SUPER_ADMIN') {
      auditLogService.recordActivity({
        req,
        action: 'BRAND_DELETED',
        category: 'Brand',
        targetType: 'Brand',
        targetId: previous._id,
        targetName: previous.name,
        previousData: previous,
        reason: req.body?.reason || 'Global brand deleted',
      });
    }

    return true;
  }

  async getCategories() {
    return GlobalCategory.find().sort({ name: 1 });
  }

  async createCategory(data, req = null) {
    const category = await GlobalCategory.create(data);

    if (req && req.user?.role === 'SUPER_ADMIN') {
      auditLogService.recordActivity({
        req,
        action: 'CATEGORY_CREATED',
        category: 'Global Settings',
        targetType: 'Device Model',
        targetId: category._id,
        targetName: category.name,
        newData: category,
        reason: data.reason || 'Hardware category created',
      });
    }

    return category;
  }
}
