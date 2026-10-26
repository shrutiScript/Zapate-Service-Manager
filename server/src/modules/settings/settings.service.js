import { Shop } from '../shops/shop.model.js';
import { Settings } from './settings.model.js';
import { auditLogService } from '../admin/auditLog.service.js';
import { subscriptionService } from '../shops/subscription.service.js';

export class SettingsService {
  async get(shopId = null) {
    if (shopId) {
      const shop = await Shop.findById(shopId);
      if (shop) {
        const now = new Date();
        const liveStatus = subscriptionService.calculateStatus(shop, now);
        return {
          ...shop.toObject(),
          daysRemaining: subscriptionService.getDaysRemaining(shop, now),
          calculatedStatus: liveStatus,
          subscriptionStatus: liveStatus,
          serverTime: now,
          shopName: shop.name,
          phone: shop.shopContactNumber || shop.ownerMobile,
          email: shop.businessEmail || shop.ownerEmail,
          address:
            [
              shop.addressLine1,
              shop.addressLine2,
              shop.landmark,
              shop.city,
              shop.state,
              shop.pincode,
            ]
              .filter(Boolean)
              .join(', ') ||
            shop.addressLine1 ||
            '',
          gstin: shop.gstNumber || '',
          warrantyTerms: shop.termsAndConditions || '',
          termsAndConditions:
            shop.termsAndConditions ||
            '1. Device must be collected within 10 days.\n2. Physical damage and water damage are not covered under warranty.\n3. Warranty is not applicable if another technician opens or repairs the device.\n4. Data loss is not the responsibility of the workshop.',
        };
      }
    }
    let s = await Settings.findOne();
    if (!s) {
      s = await Settings.create({});
    }
    return s;
  }

  async update(data, shopId = null, req = null) {
    if (shopId) {
      const shop = await Shop.findById(shopId);
      if (shop) {
        const previousShop = shop.toObject();

        if (data.shopName || data.name) shop.name = (data.shopName || data.name).trim();
        if (data.phone || data.contactNumber) {
          shop.shopContactNumber = (data.phone || data.contactNumber).trim();
          shop.ownerMobile = (data.phone || data.contactNumber).trim();
        }
        if (data.email || data.businessEmail) {
          shop.businessEmail = (data.email || data.businessEmail).trim();
        }
        if (data.address || data.addressLine1) {
          shop.addressLine1 = (data.address || data.addressLine1).trim();
        }
        if (data.city) shop.city = data.city.trim();
        if (data.state) shop.state = data.state.trim();
        if (data.pincode) shop.pincode = data.pincode.trim();
        if (data.gstNumber !== undefined || data.gstin !== undefined) {
          shop.gstNumber = (data.gstNumber || data.gstin || '').trim();
        }
        if (data.logo !== undefined) shop.logo = data.logo;
        if (data.businessType) shop.businessType = data.businessType.trim();
        if (data.invoicePrefix) shop.invoicePrefix = data.invoicePrefix.trim();
        if (data.invoiceFooter || data.footerNote) {
          shop.invoiceFooter = (data.invoiceFooter || data.footerNote).trim();
        }
        if (data.termsAndConditions !== undefined || data.warrantyTerms !== undefined) {
          shop.termsAndConditions = (data.termsAndConditions || data.warrantyTerms || '').trim();
        }
        if (data.warrantyDays !== undefined) {
          shop.warrantyDays = Number(data.warrantyDays) || 30;
        }

        await shop.save();

        if (req && req.user?.role === 'SUPER_ADMIN') {
          auditLogService.recordActivity({
            req,
            action: 'SETTINGS_UPDATED',
            category: 'Global Settings',
            targetType: 'Workshop Settings',
            targetId: shop._id,
            targetName: shop.name,
            previousData: previousShop,
            newData: shop,
          });
        }

        return this.get(shopId);
      }
    }

    let s = await Settings.findOne();
    const previousSettings = s ? s.toObject() : null;

    if (!s) {
      s = await Settings.create(data);
    } else {
      s = await Settings.findByIdAndUpdate(s._id, data, { new: true });
    }

    if (req && req.user?.role === 'SUPER_ADMIN') {
      auditLogService.recordActivity({
        req,
        action: 'SETTINGS_UPDATED',
        category: 'Global Settings',
        targetType: 'System Settings',
        targetId: s._id,
        targetName: 'Global Platform Settings',
        previousData: previousSettings,
        newData: s,
        reason: data.reason || 'Global platform settings updated by Super Admin',
      });
    }

    return s;
  }
}
