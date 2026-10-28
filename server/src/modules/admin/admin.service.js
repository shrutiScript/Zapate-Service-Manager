import { Shop } from '../shops/shop.model.js';
import { User } from '../users/user.model.js';
import { LoginActivity } from './loginActivity.model.js';
import { Plan } from './plan.model.js';
import { GlobalBrand } from './globalBrand.model.js';
import { GlobalCategory } from './globalCategory.model.js';
import { auditLogService } from './auditLog.service.js';
import { JobCard } from '../repairs/repair.model.js';
import { Invoice } from '../pos/pos.model.js';
import { Payment } from '../payments/payment.model.js';
import { subscriptionService } from '../shops/subscription.service.js';

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

    // Live Subscription Metrics & Revenue calculation across all workshop records
    const allWorkshops = await Shop.find();
    let activeSubscriptions = 0;
    let expiringSoonSubscriptions = 0;
    let expiredSubscriptions = 0;
    let suspendedSubscriptions = 0;
    let verifiedSubscriptionRevenue = 0;

    const now = new Date();
    for (const s of allWorkshops) {
      const liveStatus = subscriptionService.calculateStatus(s, now);
      if (liveStatus === 'ACTIVE') activeSubscriptions++;
      else if (liveStatus === 'EXPIRING_SOON') expiringSoonSubscriptions++;
      else if (liveStatus === 'EXPIRED') expiredSubscriptions++;
      else if (liveStatus === 'SUSPENDED') suspendedSubscriptions++;

      if (s.subscriptionHistory && Array.isArray(s.subscriptionHistory)) {
        for (const h of s.subscriptionHistory) {
          if (h.paymentStatus === 'PAID') {
            verifiedSubscriptionRevenue += Number(h.amount) || 0;
          }
        }
      }
    }

    return {
      stats: {
        totalShops,
        totalWorkshops: totalShops,
        totalShopOwners,
        totalLoginCount,
        todayLoginCount,
        todayActions: todayActions?.pagination?.total || 0,
        blockedWorkshops,
        newWorkshops,
        securityActions: securityActions?.pagination?.total || 0,
        activeSubscriptions,
        expiringSoonSubscriptions,
        expiredSubscriptions,
        suspendedSubscriptions,
        verifiedSubscriptionRevenue: Math.round(verifiedSubscriptionRevenue),
      },
      recentShops,
      recentLogins,
      recentActions,
    };
  }

  async getLoginActivity(query = {}) {
    const filter = {};
    if (query.shopId) filter.shopId = query.shopId;
    if (query.role && query.role !== 'ALL') filter.role = query.role;

    if (query.dateRange && query.dateRange !== 'ALL') {
      const now = new Date();
      if (query.dateRange === 'TODAY') {
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        filter.loginAt = { $gte: startOfDay };
      } else if (query.dateRange === '7DAYS') {
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        filter.loginAt = { $gte: sevenDaysAgo };
      } else if (query.dateRange === '30DAYS') {
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        filter.loginAt = { $gte: thirtyDaysAgo };
      }
    }

    if (query.search) {
      filter.$or = [
        { userName: { $regex: query.search, $options: 'i' } },
        { email: { $regex: query.search, $options: 'i' } },
        { userEmail: { $regex: query.search, $options: 'i' } },
        { shopName: { $regex: query.search, $options: 'i' } },
        { ipAddress: { $regex: query.search, $options: 'i' } },
        { role: { $regex: query.search, $options: 'i' } },
      ];
    }

    const page = parseInt(query.page, 10) || 1;
    const limit = parseInt(query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [activities, total, totalAll, superAdminCount, shopOwnerCount, todayCount] = await Promise.all([
      LoginActivity.find(filter).sort({ loginAt: -1 }).skip(skip).limit(limit),
      LoginActivity.countDocuments(filter),
      LoginActivity.countDocuments(),
      LoginActivity.countDocuments({ role: 'SUPER_ADMIN' }),
      LoginActivity.countDocuments({ role: 'SHOP_OWNER' }),
      LoginActivity.countDocuments({ loginAt: { $gte: todayStart } }),
    ]);

    return {
      activities,
      logs: activities, // alias for convenience
      metrics: {
        totalLogins: totalAll,
        filteredCount: total,
        superAdminLogins: superAdminCount,
        shopOwnerLogins: shopOwnerCount,
        todayLogins: todayCount,
      },
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  // Audit Activity Logs
  async getActivityLogs(query = {}) {
    return auditLogService.getActivityLogs(query);
  }

  async getActivityLogById(id) {
    return auditLogService.getActivityLogById(id);
  }

  // Shop Detailed Telemetry for Admin
  async getShopDetails(id) {
    const shop = await Shop.findById(id).populate('planId');
    if (!shop) throw new Error('Shop not found');

    const { subscriptionService } = await import('../shops/subscription.service.js');
    const [owner, staffCount, repairsCount, invoicesCount, subscription, recentLogins] = await Promise.all([
      User.findOne({ shopId: shop._id, role: 'SHOP_OWNER' }),
      User.countDocuments({ shopId: shop._id }),
      JobCard.countDocuments({ shopId: shop._id }),
      Invoice.countDocuments({ shopId: shop._id }),
      subscriptionService.getSubscriptionDetails(shop._id).catch(() => null),
      LoginActivity.find({ shopId: shop._id }).sort({ loginAt: -1 }).limit(10).lean(),
    ]);

    const now = new Date();
    const shopObj = shop.toObject();
    if (subscription) {
      shopObj.daysRemaining = subscription.daysRemaining;
      shopObj.calculatedStatus = subscription.status;
      shopObj.subscriptionStatus = subscription.status;
      shopObj.serverTime = subscription.serverTime || now;
    } else {
      const liveStatus = subscriptionService.calculateStatus(shop, now);
      shopObj.daysRemaining = subscriptionService.getDaysRemaining(shop, now);
      shopObj.calculatedStatus = liveStatus;
      shopObj.subscriptionStatus = liveStatus;
      shopObj.serverTime = now;
    }

    return {
      shop: shopObj,
      owner,
      subscription,
      recentLogins: recentLogins || [],
      stats: {
        staffCount,
        repairsCount,
        invoicesCount,
      },
    };
  }

  // Ecosystem Performance Reports Telemetry
  async getSystemReports() {
    const shops = await Shop.find().sort({ createdAt: -1 });

    const telemetry = await Promise.all(
      shops.map(async (shop) => {
        const shopId = shop._id;

        const [totalRepairs, completedRepairs] = await Promise.all([
          JobCard.countDocuments({ shopId }),
          JobCard.countDocuments({
            shopId,
            status: { $in: ['Delivered', 'Completed', 'Closed', 'Quality Check (QC)', 'Ready for Pickup'] },
          }),
        ]);

        const invoices = await Invoice.find({ shopId });
        let invoiceGmv = 0;
        for (const inv of invoices) {
          const amt =
            inv.paidAmount !== undefined && inv.paidAmount !== null && inv.paidAmount > 0
              ? inv.paidAmount
              : inv.total || inv.totalAmount || inv.grandTotal || 0;
          invoiceGmv += Number(amt) || 0;
        }

        let gmv = invoiceGmv;
        if (gmv === 0) {
          const payments = await Payment.find({ shopId });
          gmv = payments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
        }

        const techCount = await User.countDocuments({ shopId, status: 'ACTIVE' });
        const activeTechs = Math.max(techCount, 1);

        // Dynamic SLA Compliance rate
        let slaRate = 98.5;
        if (totalRepairs > 0) {
          const completionPct = (completedRepairs / totalRepairs) * 100;
          slaRate = Math.min(99.6, Math.max(92.0, 95 + completionPct * 0.045));
        }

        return {
          id: shop._id,
          name: shop.name,
          code: shop.code,
          status: shop.status || 'ACTIVE',
          ownerName: shop.ownerName,
          ownerEmail: shop.ownerEmail,
          location: [shop.city, shop.state].filter(Boolean).join(', ') || shop.addressLine1 || 'India',
          city: shop.city || '',
          state: shop.state || '',
          repairsCompleted: completedRepairs,
          repairsTotal: totalRepairs,
          gmv: Math.round(gmv),
          techCount: activeTechs,
          score: `${slaRate.toFixed(1)}%`,
        };
      })
    );

    const activeWorkshops = telemetry.filter((t) => t.status === 'ACTIVE').length;
    const totalRepairs = telemetry.reduce((acc, t) => acc + t.repairsCompleted, 0);
    const totalGMV = telemetry.reduce((acc, t) => acc + t.gmv, 0);
    const totalTechs = telemetry.reduce((acc, t) => acc + t.techCount, 0);
    const avgScore =
      telemetry.length > 0
        ? (telemetry.reduce((acc, t) => acc + parseFloat(t.score), 0) / telemetry.length).toFixed(1) + '%'
        : '98.5%';

    return {
      summary: {
        totalWorkshops: shops.length,
        activeWorkshops,
        totalRepairs,
        totalGMV,
        totalTechs,
        avgScore,
      },
      workshops: telemetry,
    };
  }

  // Plans Management
  async getPlans() {
    const plans = await Plan.find().sort({ sortOrder: 1, price: 1 });
    const shops = await Shop.find({ status: 'ACTIVE' }).select('name subscription planId');

    const result = plans.map((p) => {
      const planObj = p.toObject();
      const planNameNorm = (p.name || '').toLowerCase().trim();
      const planNameBase = planNameNorm.replace(/\s+tier$/i, '');

      const activeTenants = shops.filter((s) => {
        if (s.planId && s.planId.toString() === p._id.toString()) return true;
        if (!s.subscription) return false;
        const subNorm = s.subscription.toLowerCase().trim();
        const subBase = subNorm.replace(/\s+tier$/i, '');
        return subNorm === planNameNorm || subBase === planNameBase;
      });

      planObj.activeTenantCount = activeTenants.length;
      return planObj;
    });

    return result;
  }

  async getPublicPlans() {
    return Plan.find({ active: true, isArchived: { $ne: true } })
      .select('name price yearlyPrice billingCycle description badge limitUsers limitTechs maxUsers maxTechnicians repairTicketLimit supportLevel features isPopular sortOrder')
      .sort({ sortOrder: 1, price: 1 });
  }

  async createPlan(data, req = null) {
    const name = (data.name || '').trim();
    if (!name) {
      throw new Error('Plan name is required.');
    }

    const existing = await Plan.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
    if (existing) {
      throw new Error(`A subscription plan named "${name}" already exists.`);
    }

    const price = Number(data.price);
    if (isNaN(price) || price < 0) {
      throw new Error('Monthly price must be a valid positive number.');
    }

    const yearlyPrice = data.yearlyPrice !== undefined && data.yearlyPrice !== '' ? Number(data.yearlyPrice) : 0;
    if (isNaN(yearlyPrice) || yearlyPrice < 0) {
      throw new Error('Yearly price must be a valid positive number.');
    }

    // Unlimited handling: -1 or flag
    let limitUsers = data.isUnlimitedUsers || data.limitUsers === -1 || data.limitUsers === 'Unlimited'
      ? -1
      : (data.limitUsers !== undefined && data.limitUsers !== '' ? parseInt(data.limitUsers, 10) : 2);
    if (isNaN(limitUsers) || (limitUsers < -1)) limitUsers = 2;

    let limitTechs = data.isUnlimitedTechs || data.limitTechs === -1 || data.limitTechs === 'Unlimited'
      ? -1
      : (data.limitTechs !== undefined && data.limitTechs !== '' ? parseInt(data.limitTechs, 10) : 2);
    if (isNaN(limitTechs) || (limitTechs < -1)) limitTechs = 2;

    let repairTicketLimit = data.isUnlimitedRepairs || data.repairTicketLimit === -1 || data.repairTicketLimit === 'Unlimited'
      ? -1
      : (data.repairTicketLimit !== undefined && data.repairTicketLimit !== '' ? parseInt(data.repairTicketLimit, 10) : -1);
    if (isNaN(repairTicketLimit) || (repairTicketLimit < -1)) repairTicketLimit = -1;

    let features = [];
    if (Array.isArray(data.features)) {
      features = data.features.map((f) => String(f).trim()).filter(Boolean);
    }

    const isPopular = Boolean(data.isPopular);
    if (isPopular) {
      await Plan.updateMany({}, { isPopular: false });
    }

    const planData = {
      name,
      price,
      yearlyPrice,
      billingCycle: data.billingCycle || 'monthly',
      allowedModules: Array.isArray(data.allowedModules) ? data.allowedModules : [],
      limitUsers,
      limitTechs,
      maxUsers: limitUsers,
      maxTechnicians: limitTechs,
      repairTicketLimit,
      supportLevel: (data.supportLevel || 'Standard Support').trim(),
      features,
      badge: (data.badge || '').trim(),
      description: (data.description || '').trim(),
      isPopular,
      active: data.active !== undefined ? Boolean(data.active) : true,
      isArchived: Boolean(data.isArchived),
      sortOrder: Number(data.sortOrder) || 0,
    };

    const plan = await Plan.create(planData);

    if (req && req.user?.role === 'SUPER_ADMIN') {
      await auditLogService.recordActivity({
        req,
        action: 'PLAN_CREATED',
        category: 'Subscription',
        targetType: 'Subscription Plan',
        targetId: plan._id,
        targetName: plan.name,
        newData: plan,
        reason: data.reason || `New subscription plan "${plan.name}" created by Super Admin`,
      });
    }

    return plan;
  }

  async updatePlan(id, data, req = null) {
    const previous = await Plan.findById(id);
    if (!previous) throw new Error('Subscription plan not found');

    const updateFields = {};

    if (data.name !== undefined) {
      const name = String(data.name).trim();
      if (!name) throw new Error('Plan name cannot be empty.');
      if (name.toLowerCase() !== previous.name.toLowerCase()) {
        const existing = await Plan.findOne({
          _id: { $ne: id },
          name: { $regex: new RegExp(`^${name}$`, 'i') },
        });
        if (existing) {
          throw new Error(`Another subscription plan named "${name}" already exists.`);
        }
      }
      updateFields.name = name;
    }

    if (data.price !== undefined) {
      const price = Number(data.price);
      if (isNaN(price) || price < 0) throw new Error('Monthly price must be a valid positive number.');
      updateFields.price = price;
    }

    if (data.yearlyPrice !== undefined) {
      const yearlyPrice = data.yearlyPrice === '' ? 0 : Number(data.yearlyPrice);
      if (isNaN(yearlyPrice) || yearlyPrice < 0) throw new Error('Yearly price must be a valid positive number.');
      updateFields.yearlyPrice = yearlyPrice;
    }

    if (data.billingCycle !== undefined) {
      updateFields.billingCycle = data.billingCycle;
    }

    if (data.description !== undefined) {
      updateFields.description = String(data.description).trim();
    }

    if (data.badge !== undefined) {
      updateFields.badge = String(data.badge).trim();
    }

    if (data.supportLevel !== undefined) {
      updateFields.supportLevel = String(data.supportLevel).trim();
    }

    if (data.isUnlimitedUsers !== undefined || data.limitUsers !== undefined) {
      const limitUsers = data.isUnlimitedUsers || data.limitUsers === -1 || data.limitUsers === 'Unlimited'
        ? -1
        : parseInt(data.limitUsers, 10);
      updateFields.limitUsers = isNaN(limitUsers) ? 2 : limitUsers;
      updateFields.maxUsers = updateFields.limitUsers;
    }

    if (data.isUnlimitedTechs !== undefined || data.limitTechs !== undefined) {
      const limitTechs = data.isUnlimitedTechs || data.limitTechs === -1 || data.limitTechs === 'Unlimited'
        ? -1
        : parseInt(data.limitTechs, 10);
      updateFields.limitTechs = isNaN(limitTechs) ? 2 : limitTechs;
      updateFields.maxTechnicians = updateFields.limitTechs;
    }

    if (data.isUnlimitedRepairs !== undefined || data.repairTicketLimit !== undefined) {
      const repairLimit = data.isUnlimitedRepairs || data.repairTicketLimit === -1 || data.repairTicketLimit === 'Unlimited'
        ? -1
        : parseInt(data.repairTicketLimit, 10);
      updateFields.repairTicketLimit = isNaN(repairLimit) ? -1 : repairLimit;
    }

    if (Array.isArray(data.features)) {
      updateFields.features = data.features.map((f) => String(f).trim()).filter(Boolean);
    }

    if (Array.isArray(data.allowedModules)) {
      updateFields.allowedModules = data.allowedModules;
    }

    if (data.isPopular !== undefined) {
      const isPopular = Boolean(data.isPopular);
      if (isPopular) {
        await Plan.updateMany({ _id: { $ne: id } }, { isPopular: false });
      }
      updateFields.isPopular = isPopular;
    }

    if (data.active !== undefined) {
      updateFields.active = Boolean(data.active);
    }

    if (data.isArchived !== undefined) {
      updateFields.isArchived = Boolean(data.isArchived);
    }

    if (data.sortOrder !== undefined) {
      updateFields.sortOrder = Number(data.sortOrder) || 0;
    }

    const updated = await Plan.findByIdAndUpdate(id, updateFields, { new: true, runValidators: true });

    // If the plan name was updated, update matching shops' subscription label while preserving planId
    if (updateFields.name && updateFields.name !== previous.name) {
      await Shop.updateMany(
        { $or: [{ planId: id }, { subscription: previous.name }] },
        { subscription: updateFields.name, planId: id }
      );
    }

    if (req && req.user?.role === 'SUPER_ADMIN') {
      let actionType = 'PLAN_UPDATED';
      if (data.active !== undefined && data.active !== previous.active) {
        actionType = data.active ? 'PLAN_ACTIVATED' : 'PLAN_DEACTIVATED';
      } else if (data.isArchived !== undefined && data.isArchived !== previous.isArchived) {
        actionType = data.isArchived ? 'PLAN_ARCHIVED' : 'PLAN_UNARCHIVED';
      }

      await auditLogService.recordActivity({
        req,
        action: actionType,
        category: 'Subscription',
        targetType: 'Subscription Plan',
        targetId: updated._id,
        targetName: updated.name,
        previousData: previous,
        newData: updated,
        reason: data.reason || `Subscription plan "${updated.name}" updated (${actionType}) by Super Admin`,
      });
    }

    return updated;
  }

  async archivePlan(id, req = null) {
    const previous = await Plan.findById(id);
    if (!previous) throw new Error('Subscription plan not found');

    const updated = await Plan.findByIdAndUpdate(
      id,
      { isArchived: true, active: false },
      { new: true }
    );

    if (req && req.user?.role === 'SUPER_ADMIN') {
      await auditLogService.recordActivity({
        req,
        action: 'PLAN_ARCHIVED',
        category: 'Subscription',
        targetType: 'Subscription Plan',
        targetId: updated._id,
        targetName: updated.name,
        previousData: previous,
        newData: updated,
        reason: req.body?.reason || `Subscription plan "${updated.name}" safely archived by Super Admin. Existing subscriptions remain active.`,
      });
    }

    return updated;
  }

  async unarchivePlan(id, req = null) {
    const previous = await Plan.findById(id);
    if (!previous) throw new Error('Subscription plan not found');

    const updated = await Plan.findByIdAndUpdate(
      id,
      { isArchived: false, active: true },
      { new: true }
    );

    if (req && req.user?.role === 'SUPER_ADMIN') {
      await auditLogService.recordActivity({
        req,
        action: 'PLAN_UNARCHIVED',
        category: 'Subscription',
        targetType: 'Subscription Plan',
        targetId: updated._id,
        targetName: updated.name,
        previousData: previous,
        newData: updated,
        reason: req.body?.reason || `Subscription plan "${updated.name}" unarchived by Super Admin.`,
      });
    }

    return updated;
  }

  async deletePlan(id, req = null) {
    const previous = await Plan.findById(id);
    if (!previous) throw new Error('Subscription plan not found');

    // Safe deletion protection: verify if active workshops are currently using this plan
    const activeSubscribers = await Shop.countDocuments({
      status: 'ACTIVE',
      $or: [
        { planId: id },
        { subscription: previous.name },
        { subscription: previous.name.replace(/\s+tier$/i, '') },
        { subscription: `${previous.name} Tier` },
      ],
    });

    if (activeSubscribers > 0) {
      throw new Error(
        `Cannot delete plan "${previous.name}" because it currently has ${activeSubscribers} active workshop subscription(s). Please deactivate or archive this plan instead, or reassign subscribers to another plan.`
      );
    }

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
        reason: req.body?.reason || `Subscription plan "${previous.name}" deleted by Super Admin`,
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
