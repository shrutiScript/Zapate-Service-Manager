import bcrypt from 'bcryptjs';
import { Shop } from './shop.model.js';
import { User } from '../users/user.model.js';
import { auditLogService } from '../admin/auditLog.service.js';

export class ShopService {
  async getAll(query = {}) {
    return Shop.find({}).sort({ createdAt: -1 });
  }

  async getById(id) {
    const shop = await Shop.findById(id);
    if (!shop) throw new Error('Shop not found');
    return shop;
  }

  async getByCode(code) {
    const shop = await Shop.findOne({ code });
    if (!shop) throw new Error('Shop not found');
    return shop;
  }

  async completeShopSetup(shopId, data) {
    const shop = await Shop.findById(shopId);
    if (!shop) throw new Error('Shop not found or unauthorized');

    // Mandatory Field Validations & Logo Auto-Generation
    if (!data.logo?.trim()) {
      data.logo = `https://ui-avatars.com/api/?name=${encodeURIComponent(data.name?.trim() || 'Workshop')}&background=2563eb&color=fff&size=150`;
    }
    if (!data.name?.trim()) throw new Error('Shop Name is mandatory.');
    if (!data.shopContactNumber?.trim()) throw new Error('Shop Contact Number is mandatory.');
    if (!data.businessEmail?.trim()) throw new Error('Business Email is mandatory.');
    if (!data.addressLine1?.trim()) throw new Error('Shop Address Line 1 is mandatory.');
    if (!data.city?.trim()) throw new Error('City is mandatory.');
    if (!data.state?.trim()) throw new Error('State is mandatory.');
    if (!data.pincode?.trim()) throw new Error('Pincode is mandatory.');
    if (!data.businessType?.trim()) throw new Error('Business Type is mandatory.');
    if (!data.invoicePrefix?.trim()) throw new Error('Invoice Prefix is mandatory.');

    // Save All Setup Details
    shop.logo = data.logo;
    shop.name = data.name.trim();
    shop.shopContactNumber = data.shopContactNumber.trim();
    shop.businessEmail = data.businessEmail.trim();

    shop.addressLine1 = data.addressLine1.trim();
    shop.addressLine2 = data.addressLine2 ? data.addressLine2.trim() : '';
    shop.landmark = data.landmark ? data.landmark.trim() : '';
    shop.city = data.city.trim();
    shop.state = data.state.trim();
    shop.pincode = data.pincode.trim();
    shop.country = data.country ? data.country.trim() : 'India';

    shop.businessType = data.businessType.trim();
    shop.invoicePrefix = data.invoicePrefix.trim();
    shop.gstNumber = data.gstNumber ? data.gstNumber.trim() : '';
    shop.invoiceFooter = data.invoiceFooter
      ? data.invoiceFooter.trim()
      : 'Thank you for choosing our repair services!';

    shop.onboardingCompleted = true;
    await shop.save();

    // Mark user onboardingCompleted = true
    await User.updateMany({ shopId: shop._id }, { onboardingCompleted: true });

    return shop;
  }

  async create(data, req = null) {
    const existing = await Shop.findOne({
      $or: [{ ownerEmail: data.ownerEmail?.toLowerCase() }, { code: data.code }],
    });
    if (existing) {
      throw new Error('A workshop with this email or code already exists.');
    }

    const shop = await Shop.create(data);

    // Audit log
    if (req && req.user?.role === 'SUPER_ADMIN') {
      auditLogService.recordActivity({
        req,
        action: 'WORKSHOP_CREATED',
        category: 'Workshop',
        targetType: 'Workshop',
        targetId: shop._id,
        targetName: shop.name,
        newData: shop,
        reason: data.reason || 'New workshop onboarded by Super Admin',
      });
    }

    return shop;
  }

  async update(id, data, req = null) {
    const previous = await Shop.findById(id);
    if (!previous) throw new Error('Shop not found');

    const updated = await Shop.findByIdAndUpdate(id, data, { new: true });

    // Audit log if performed by Super Admin
    if (req && req.user?.role === 'SUPER_ADMIN') {
      auditLogService.recordActivity({
        req,
        action: 'WORKSHOP_UPDATED',
        category: 'Workshop',
        targetType: 'Workshop',
        targetId: updated._id,
        targetName: updated.name,
        previousData: previous,
        newData: updated,
        reason: data.reason || 'Workshop information updated',
      });
    }

    return updated;
  }

  /**
   * Block a workshop, immediately invalidating all active sessions and disabling login
   */
  async blockWorkshop(id, reason = 'Blocked by platform administrator', req = null) {
    const shop = await Shop.findById(id);
    if (!shop) throw new Error('Shop not found');

    const previousStatus = shop.status || 'ACTIVE';
    const now = new Date();

    shop.status = 'BLOCKED';
    shop.blockedReason = reason;
    shop.blockedAt = now;
    shop.sessionInvalidatedAt = now;
    await shop.save();

    // Invalidate all active user accounts for this workshop
    await User.updateMany(
      { shopId: shop._id },
      { status: 'BLOCKED', sessionInvalidatedAt: now }
    );

    // Record Audit Log
    auditLogService.recordActivity({
      req,
      action: 'WORKSHOP_BLOCKED',
      category: 'Workshop',
      targetType: 'Workshop',
      targetId: shop._id,
      targetName: shop.name,
      previousData: { status: previousStatus },
      newData: {
        status: 'BLOCKED',
        systemResult: 'All active sessions invalidated',
        loginAccess: 'Disabled',
      },
      reason,
      status: 'SUCCESS',
    });

    return shop;
  }

  /**
   * Unblock a workshop, restoring future login access while keeping expired sessions invalid
   */
  async unblockWorkshop(id, reason = 'Unblocked by platform administrator', req = null) {
    const shop = await Shop.findById(id);
    if (!shop) throw new Error('Shop not found');

    const previousStatus = shop.status || 'BLOCKED';

    shop.status = 'ACTIVE';
    shop.blockedReason = null;
    shop.blockedAt = null;
    await shop.save();

    // Restore users to ACTIVE (old tokens remain expired due to previous sessionInvalidatedAt)
    await User.updateMany({ shopId: shop._id }, { status: 'ACTIVE' });

    // Record Audit Log
    auditLogService.recordActivity({
      req,
      action: 'WORKSHOP_UNBLOCKED',
      category: 'Workshop',
      targetType: 'Workshop',
      targetId: shop._id,
      targetName: shop.name,
      previousData: { status: previousStatus },
      newData: {
        status: 'ACTIVE',
        loginAccess: 'Restored',
        oldSessions: 'Remain invalidated',
      },
      reason,
      status: 'SUCCESS',
    });

    return shop;
  }

  async delete(id, reason = 'Deleted by platform administrator', req = null) {
    const shop = await Shop.findById(id);
    if (!shop) throw new Error('Shop not found');

    await Shop.findByIdAndDelete(id);
    await User.deleteMany({ shopId: id });

    // Record Audit Log
    if (req && req.user?.role === 'SUPER_ADMIN') {
      auditLogService.recordActivity({
        req,
        action: 'WORKSHOP_DELETED',
        category: 'Workshop',
        targetType: 'Workshop',
        targetId: shop._id,
        targetName: shop.name,
        previousData: shop,
        reason,
        status: 'SUCCESS',
      });
    }

    return true;
  }
}
