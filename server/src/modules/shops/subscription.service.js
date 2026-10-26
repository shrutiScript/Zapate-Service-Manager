import { Shop } from './shop.model.js';
import { Plan } from '../admin/plan.model.js';
import { auditLogService } from '../admin/auditLog.service.js';
import { Notification } from '../notifications/notification.model.js';
import { NotificationDispatcher } from '../notifications/notificationDispatcher.js';

export class SubscriptionService {
  /**
   * Pure server-side computation of subscription status based on current server time
   */
  calculateStatus(shop, now = new Date()) {
    if (!shop) return 'EXPIRED';

    const mainStatus = (shop.status || '').toUpperCase();
    if (mainStatus === 'BLOCKED' || mainStatus === 'SUSPENDED') {
      return 'SUSPENDED';
    }

    if (!shop.subscriptionExpiresAt) {
      return 'ACTIVE';
    }

    const expiryTime = new Date(shop.subscriptionExpiresAt).getTime();
    const currentTime = now.getTime();

    if (currentTime >= expiryTime) {
      return 'EXPIRED';
    }

    // Expiring within 7 days
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    if (expiryTime - currentTime <= sevenDaysMs) {
      return 'EXPIRING_SOON';
    }

    return 'ACTIVE';
  }

  /**
   * Calculates days remaining until expiration
   */
  getDaysRemaining(shop, now = new Date()) {
    if (!shop || !shop.subscriptionExpiresAt) return 0;
    const diff = new Date(shop.subscriptionExpiresAt).getTime() - now.getTime();
    if (diff <= 0) return 0;
    return Math.ceil(diff / (24 * 60 * 60 * 1000));
  }

  /**
   * Scheduled Background Sweeper & Proactive Alert Dispatcher
   * Automatically marks expired subscriptions in MongoDB based on server time,
   * updates live statuses, and dispatches daily reminders for exactly 7, 6, 5, 4, 3, 2, and 1 days,
   * handles short-duration (<24h) plans, and sends on-expiry notifications.
   */
  async checkAndExpireSubscriptions() {
    try {
      const now = new Date();

      // Formatters for human-readable notifications
      const formatDateStr = (d) => {
        if (!d) return '—';
        const date = new Date(d);
        if (isNaN(date.getTime())) return '—';
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
      };

      const formatTimeStr = (d) => {
        if (!d) return '—';
        const date = new Date(d);
        if (isNaN(date.getTime())) return '—';
        let hours = date.getHours();
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12;
        return `${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;
      };

      // 1. Process Expired Workshops
      const expiredShops = await Shop.find({
        subscriptionExpiresAt: { $lte: now },
        subscriptionStatus: { $ne: 'EXPIRED' },
      });

      for (const shop of expiredShops) {
        shop.subscriptionStatus = 'EXPIRED';

        const expiryIso = new Date(shop.subscriptionExpiresAt).toISOString();
        if (!shop.subscriptionNotificationsSent) shop.subscriptionNotificationsSent = [];

        const alreadyNotified = shop.subscriptionNotificationsSent.some(
          (n) => n.event === 'EXPIRED' && n.expiresAt && new Date(n.expiresAt).toISOString() === expiryIso
        );

        if (!alreadyNotified) {
          const alertTitle = 'Subscription Expired';
          const alertMessage = `Your subscription for ${shop.name} (${shop.subscription || 'Workshop Plan'}) expired on ${formatDateStr(shop.subscriptionExpiresAt)} at ${formatTimeStr(shop.subscriptionExpiresAt)}. All workshop records, customers, and inventory data remain safely preserved. Please renew your plan to restore full station access.`;

          // Send In-App Notification
          await Notification.create({
            recipientName: shop.ownerName || 'Workshop Owner',
            recipientContact: shop.ownerEmail || shop.ownerMobile || '',
            channel: 'In-App',
            type: 'Subscription Expiry',
            title: alertTitle,
            message: alertMessage,
            status: 'Delivered',
            sentAt: now,
            shopId: shop._id,
          }).catch((e) => console.error('[Notification] Failed to create expiry alert:', e.message));

          // Multi-Channel External Dispatch (Email, SMS, WhatsApp)
          await NotificationDispatcher.dispatchExpiryNotice({
            shop,
            eventKey: 'EXPIRED',
            title: alertTitle,
            message: alertMessage,
            daysRemaining: 0,
            expiresAt: shop.subscriptionExpiresAt,
          }).catch((e) => console.error('[NotificationDispatcher] Expiry dispatch error:', e.message));

          shop.subscriptionNotificationsSent.push({
            event: 'EXPIRED',
            daysRemaining: 0,
            expiresAt: shop.subscriptionExpiresAt,
            sentAt: now,
          });
        }

        await shop.save();

        auditLogService.recordActivity({
          action: 'SUBSCRIPTION_EXPIRED',
          category: 'Subscription',
          targetType: 'Workshop',
          targetId: shop._id,
          targetName: shop.name,
          reason: `Subscription period reached expiry date and time (${new Date(shop.subscriptionExpiresAt).toISOString()})`,
          status: 'SUCCESS',
          details: {
            plan: shop.subscription,
            expiredAt: shop.subscriptionExpiresAt,
            ownerEmail: shop.ownerEmail,
          },
        });
      }

      if (expiredShops.length > 0) {
        console.log(`[SubscriptionSweeper] Marked ${expiredShops.length} workshop subscriptions as EXPIRED.`);
      }

      // 2. Proactive Daily Expiry Warnings (7, 6, 5, 4, 3, 2, 1 days & short duration)
      const activeShops = await Shop.find({
        subscriptionExpiresAt: { $gt: now },
        subscriptionStatus: { $in: ['ACTIVE', 'EXPIRING_SOON'] },
      });

      for (const shop of activeShops) {
        const expiryTime = new Date(shop.subscriptionExpiresAt).getTime();
        const diffMs = expiryTime - now.getTime();
        const daysRemaining = Math.ceil(diffMs / (24 * 60 * 60 * 1000));
        const expiryIso = new Date(shop.subscriptionExpiresAt).toISOString();

        if (!shop.subscriptionNotificationsSent) {
          shop.subscriptionNotificationsSent = [];
        }

        let isShopModified = false;

        // Auto-synchronize status to EXPIRING_SOON if within 7 days
        if (daysRemaining <= 7 && shop.subscriptionStatus === 'ACTIVE') {
          shop.subscriptionStatus = 'EXPIRING_SOON';
          isShopModified = true;
        }

        const dispatchAlert = async (eventKey, alertTitle, alertMessage, dayCount) => {
          const alreadySent = shop.subscriptionNotificationsSent.some(
            (n) => n.event === eventKey && n.expiresAt && new Date(n.expiresAt).toISOString() === expiryIso
          );
          if (alreadySent) return;

          // Double check database to prevent duplicates across multiple sweeper processes
          const existingNotif = await Notification.findOne({
            shopId: shop._id,
            type: 'Subscription Expiry',
            title: alertTitle,
            createdAt: { $gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) },
          });
          if (existingNotif) return;

          await Notification.create({
            recipientName: shop.ownerName || 'Workshop Owner',
            recipientContact: shop.ownerEmail || shop.ownerMobile || '',
            channel: 'In-App',
            type: 'Subscription Expiry',
            title: alertTitle,
            message: alertMessage,
            status: 'Delivered',
            sentAt: now,
            shopId: shop._id,
          }).catch((e) => console.error(`[Notification] Failed to create ${eventKey} alert:`, e.message));

          // Multi-Channel External Dispatch (Email, SMS, WhatsApp)
          await NotificationDispatcher.dispatchExpiryNotice({
            shop,
            eventKey,
            title: alertTitle,
            message: alertMessage,
            daysRemaining: dayCount,
            expiresAt: shop.subscriptionExpiresAt,
          }).catch((e) => console.error(`[NotificationDispatcher] Alert ${eventKey} error:`, e.message));

          shop.subscriptionNotificationsSent.push({
            event: eventKey,
            daysRemaining: dayCount,
            expiresAt: shop.subscriptionExpiresAt,
            sentAt: now,
          });
          isShopModified = true;
        };

        // Determine if total subscription duration is shorter than 24 hours
        const totalDurationMs = shop.subscriptionStartDate
          ? new Date(shop.subscriptionExpiresAt).getTime() - new Date(shop.subscriptionStartDate).getTime()
          : diffMs;
        const isShortDuration = totalDurationMs > 0 && totalDurationMs < 24 * 60 * 60 * 1000;

        if (isShortDuration) {
          // If subscription duration is shorter than 24 hours, handle using actual expiry timestamp
          // and DO NOT send incorrect day-count notifications
          await dispatchAlert(
            'SHORT_DURATION_EXPIRING',
            'Urgent: Subscription Expiring Today',
            `Your subscription for ${shop.name} (${shop.subscription || 'Workshop Plan'}) expires today on ${formatDateStr(shop.subscriptionExpiresAt)} at ${formatTimeStr(shop.subscriptionExpiresAt)}. Please renew your plan to continue using Zapate Service Manager.`,
            0
          );
        } else {
          // Standard Subscriptions (duration >= 24h): Send notifications on exactly 7, 6, 5, 4, 3, 2, 1 days
          if (daysRemaining === 1) {
            await dispatchAlert(
              '1_DAY',
              'Final Notice: Subscription Expiring in 24 Hours / 1 Day',
              'Your subscription expires tomorrow. Please renew your plan to continue using Zapate Service Manager.',
              1
            );
          } else if (daysRemaining === 2) {
            await dispatchAlert(
              '2_DAYS',
              'Reminder: Subscription Expiring in 2 Days',
              `Your subscription expires in 2 days on ${formatDateStr(shop.subscriptionExpiresAt)} at ${formatTimeStr(shop.subscriptionExpiresAt)}. Please renew your plan to continue using Zapate Service Manager.`,
              2
            );
          } else if (daysRemaining === 3) {
            await dispatchAlert(
              '3_DAYS',
              'Urgent: Subscription Expiring in 3 Days',
              `Reminder: Your subscription for ${shop.name} (${shop.subscription}) will expire in 3 days on ${formatDateStr(shop.subscriptionExpiresAt)} at ${formatTimeStr(shop.subscriptionExpiresAt)}. Renew your plan to ensure uninterrupted workshop operations.`,
              3
            );
          } else if (daysRemaining === 4) {
            await dispatchAlert(
              '4_DAYS',
              'Reminder: Subscription Expiring in 4 Days',
              `Your subscription expires in 4 days on ${formatDateStr(shop.subscriptionExpiresAt)} at ${formatTimeStr(shop.subscriptionExpiresAt)}. Please renew your plan to continue using Zapate Service Manager.`,
              4
            );
          } else if (daysRemaining === 5) {
            await dispatchAlert(
              '5_DAYS',
              'Reminder: Subscription Expiring in 5 Days',
              `Your subscription expires in 5 days on ${formatDateStr(shop.subscriptionExpiresAt)} at ${formatTimeStr(shop.subscriptionExpiresAt)}. Please renew your plan to continue using Zapate Service Manager.`,
              5
            );
          } else if (daysRemaining === 6) {
            await dispatchAlert(
              '6_DAYS',
              'Reminder: Subscription Expiring in 6 Days',
              `Your subscription expires in 6 days on ${formatDateStr(shop.subscriptionExpiresAt)} at ${formatTimeStr(shop.subscriptionExpiresAt)}. Please renew your plan to continue using Zapate Service Manager.`,
              6
            );
          } else if (daysRemaining === 7) {
            await dispatchAlert(
              '7_DAYS',
              'Notice: Subscription Expiring in 7 Days',
              `Notice: Your subscription for ${shop.name} (${shop.subscription}) will expire in 7 days on ${formatDateStr(shop.subscriptionExpiresAt)} at ${formatTimeStr(shop.subscriptionExpiresAt)}. Please plan your renewal to maintain active technician access.`,
              7
            );
          }
        }

        if (isShopModified) {
          await shop.save().catch(() => {});
        }
      }
    } catch (err) {
      console.error('[SubscriptionSweeper] Error sweeping expired subscriptions:', err);
    }
  }

  /**
   * Get complete subscription telemetry for a workshop
   */
  async getSubscriptionDetails(shopId) {
    const shop = await Shop.findById(shopId).populate('planId');
    if (!shop) throw new Error('Workshop not found');

    const now = new Date();
    const liveStatus = this.calculateStatus(shop, now);
    const daysRemaining = this.getDaysRemaining(shop, now);

    // If status drifted from calculated status, sync it
    if (shop.subscriptionStatus !== liveStatus && shop.status !== 'BLOCKED') {
      shop.subscriptionStatus = liveStatus;
      await shop.save().catch(() => {});
    }

    const availablePlans = await Plan.find({ active: true, isArchived: { $ne: true } }).sort({ sortOrder: 1, price: 1 });

    return {
      shopId: shop._id,
      shopCode: shop.code,
      shopName: shop.name,
      ownerName: shop.ownerName,
      ownerEmail: shop.ownerEmail,
      ownerMobile: shop.ownerMobile,
      contactNumber: shop.shopContactNumber || shop.ownerMobile,
      planId: shop.planId?._id || shop.planId,
      planName: shop.subscription || shop.planId?.name || 'Starter Tier',
      planDetails: shop.planId || null,
      startDate: shop.subscriptionStartDate,
      expiresAt: shop.subscriptionExpiresAt,
      daysRemaining,
      status: liveStatus,
      paymentStatus: shop.subscriptionPaymentStatus || 'PAID',
      billingCycle: shop.subscriptionBillingCycle || 'monthly',
      history: shop.subscriptionHistory || [],
      serverTime: now,
      availablePlans,
    };
  }

  /**
   * Renew Workshop Subscription
   * Restores active access after successful renewal and strict backend payment confirmation.
   * Pending or failed payments are never marked as active.
   */
  async renewSubscription(shopId, data = {}, req = null) {
    const shop = await Shop.findById(shopId);
    if (!shop) throw new Error('Workshop not found');

    let plan = null;
    if (data.planId) {
      plan = await Plan.findById(data.planId);
    } else if (shop.planId) {
      plan = await Plan.findById(shop.planId);
    } else {
      plan = await Plan.findOne({ active: true, isArchived: { $ne: true } }).sort({ sortOrder: 1 });
    }

    if (!plan) throw new Error('Valid subscription plan could not be resolved');

    const paymentStatus = (data.paymentStatus || 'PAID').toUpperCase();

    // Verification check: never mark pending or failed payments as active or successful
    if (paymentStatus === 'FAILED' || paymentStatus === 'PENDING') {
      const now = new Date();
      shop.subscriptionPaymentStatus = paymentStatus;
      if (!shop.subscriptionHistory) shop.subscriptionHistory = [];
      shop.subscriptionHistory.unshift({
        planId: plan._id,
        planName: plan.name,
        startDate: shop.subscriptionStartDate || now,
        expiresAt: shop.subscriptionExpiresAt || now,
        billingCycle: data.billingCycle || 'monthly',
        amount: Number(data.amount) || plan.price,
        paymentStatus,
        paymentMethod: data.paymentMethod || 'Online Gateway / UPI',
        referenceId: data.referenceId || `PAY-UNVERIFIED-${Date.now()}`,
        renewedAt: now,
        renewedBy: req?.user?.role || data.renewedBy || 'SHOP_OWNER',
        notes: data.notes || `Subscription renewal payment unverified (${paymentStatus})`,
      });
      await shop.save();

      await auditLogService.recordActivity({
        req,
        action: 'SUBSCRIPTION_PAYMENT_STATUS_CHANGED',
        category: 'Subscription',
        targetType: 'Workshop',
        targetId: shop._id,
        targetName: shop.name,
        status: 'FAILED',
        reason: `Subscription payment is ${paymentStatus}. Access not activated.`,
        details: {
          paymentStatus,
          plan: plan.name,
          amount: data.amount,
        },
      });

      const err = new Error(
        `Subscription payment is ${paymentStatus}. Payment must be verified before subscription validity can be extended.`
      );
      err.statusCode = 400;
      err.paymentStatus = paymentStatus;
      throw err;
    }

    const billingCycle = (data.billingCycle || plan.billingCycle || 'monthly').toLowerCase();
    let durationDays = 30;
    let durationMs = 30 * 24 * 60 * 60 * 1000;

    if (data.durationHours || data.hours || plan.durationHours) {
      const hours = Number(data.durationHours || data.hours || plan.durationHours);
      durationMs = hours * 60 * 60 * 1000;
      durationDays = Math.max(1, Math.ceil(hours / 24));
    } else if (data.durationDays || data.days || plan.durationDays) {
      durationDays = Number(data.durationDays || data.days || plan.durationDays);
      durationMs = durationDays * 24 * 60 * 60 * 1000;
    } else if (billingCycle === 'yearly') {
      durationDays = 365;
      durationMs = 365 * 24 * 60 * 60 * 1000;
    } else if (billingCycle === 'quarterly') {
      durationDays = 90;
      durationMs = 90 * 24 * 60 * 60 * 1000;
    } else if (billingCycle === 'weekly') {
      durationDays = 7;
      durationMs = 7 * 24 * 60 * 60 * 1000;
    } else if (billingCycle === 'daily') {
      durationDays = 1;
      durationMs = 1 * 24 * 60 * 60 * 1000;
    } else {
      const matchDay = billingCycle.match(/(\d+)\s*day/i);
      const matchHour = billingCycle.match(/(\d+)\s*hour/i);
      if (matchHour) {
        const hours = parseInt(matchHour[1], 10);
        durationMs = hours * 60 * 60 * 1000;
        durationDays = Math.max(1, Math.ceil(hours / 24));
      } else if (matchDay) {
        durationDays = parseInt(matchDay[1], 10);
        durationMs = durationDays * 24 * 60 * 60 * 1000;
      }
    }

    const now = new Date();
    let newStartDate = now;
    let newExpiresAt;

    const previousExpiry = shop.subscriptionExpiresAt;

    // If existing subscription is still active and in the future, extend from current expiry date unless reset requested
    if (data.newExpiryDate || data.expiresAt) {
      newExpiresAt = new Date(data.newExpiryDate || data.expiresAt);
    } else if (!data.resetStartDate && shop.subscriptionExpiresAt && new Date(shop.subscriptionExpiresAt).getTime() > now.getTime()) {
      newStartDate = new Date(shop.subscriptionStartDate || now);
      newExpiresAt = new Date(new Date(shop.subscriptionExpiresAt).getTime() + durationMs);
    } else {
      // If currently expired, missing, or explicitly starting fresh
      newStartDate = now;
      newExpiresAt = new Date(now.getTime() + durationMs);
    }

    const amount =
      data.amount !== undefined && data.amount !== null
        ? Number(data.amount)
        : billingCycle === 'yearly' && plan.yearlyPrice
        ? plan.yearlyPrice
        : plan.price;

    const performer = req?.user?.role || data.renewedBy || 'SHOP_OWNER';
    const referenceId = data.referenceId || `REN-${shop.code || 'WS'}-${Date.now()}`;

    // Update Shop Subscription fields
    shop.planId = plan._id;
    shop.subscription = plan.name;
    shop.subscriptionStartDate = newStartDate;
    shop.subscriptionExpiresAt = newExpiresAt;
    shop.subscriptionBillingCycle = billingCycle;
    shop.subscriptionStatus = 'ACTIVE';
    shop.subscriptionPaymentStatus = 'PAID';
    shop.sessionInvalidatedAt = null; // Clear session block

    // Reset notification tracker for the new validity period
    shop.subscriptionNotificationsSent = [];

    // Enable plan allowed modules
    if (plan.allowedModules && plan.allowedModules.length > 0) {
      shop.enabledModules = plan.allowedModules;
    }

    // Append to Renewal History
    if (!shop.subscriptionHistory) shop.subscriptionHistory = [];
    shop.subscriptionHistory.unshift({
      planId: plan._id,
      planName: plan.name,
      startDate: newStartDate,
      expiresAt: newExpiresAt,
      previousExpiresAt: previousExpiry,
      billingCycle,
      amount,
      paymentStatus: 'PAID',
      paymentMethod: data.paymentMethod || 'Online Gateway / UPI',
      referenceId,
      renewedAt: now,
      renewedBy: performer,
      notes: data.notes || `Subscription renewed for ${durationDays} days under ${plan.name}`,
    });

    await shop.save();

    // Audit Log
    await auditLogService.recordActivity({
      req,
      action: 'SUBSCRIPTION_RENEWED',
      category: 'Subscription',
      targetType: 'Workshop',
      targetId: shop._id,
      targetName: shop.name,
      performedBy: req?.user?.name || shop.ownerName || 'Workshop Owner',
      reason: data.notes || `Workshop subscription renewed for ${durationDays} days`,
      status: 'SUCCESS',
      details: {
        plan: plan.name,
        billingCycle,
        amount,
        referenceId,
        newExpiresAt,
      },
    });

    return {
      success: true,
      message: `Subscription successfully renewed until ${newExpiresAt.toLocaleDateString()}`,
      shop,
      plan,
      newExpiresAt,
      daysRemaining: this.getDaysRemaining(shop, now),
    };
  }

  /**
   * Super Admin Extension / Status Override
   * Manually extend validity or alter subscription parameters with strict auditing.
   * Records actor, timestamp, previous expiry, new expiry, and reason.
   */
  async extendSubscription(shopId, data = {}, req = null) {
    const shop = await Shop.findById(shopId);
    if (!shop) throw new Error('Workshop not found');

    const now = new Date();
    let newExpiresAt = null;

    if (data.newExpiryDate) {
      newExpiresAt = new Date(data.newExpiryDate);
      if (isNaN(newExpiresAt.getTime())) {
        throw new Error('Invalid expiry date provided');
      }
    } else if (data.hours || data.extendHours) {
      const hours = parseInt(data.hours || data.extendHours, 10);
      if (isNaN(hours) || hours <= 0) throw new Error('Hours must be a positive number');

      const currentExpiry =
        shop.subscriptionExpiresAt && new Date(shop.subscriptionExpiresAt).getTime() > now.getTime()
          ? new Date(shop.subscriptionExpiresAt)
          : now;

      newExpiresAt = new Date(currentExpiry.getTime() + hours * 60 * 60 * 1000);
    } else if (data.days || data.extendDays) {
      const days = parseInt(data.days || data.extendDays, 10);
      if (isNaN(days) || days <= 0) throw new Error('Days must be a positive number');

      const currentExpiry =
        shop.subscriptionExpiresAt && new Date(shop.subscriptionExpiresAt).getTime() > now.getTime()
          ? new Date(shop.subscriptionExpiresAt)
          : now;

      newExpiresAt = new Date(currentExpiry.getTime() + days * 24 * 60 * 60 * 1000);
    } else {
      // Default extend by 30 days
      const currentExpiry =
        shop.subscriptionExpiresAt && new Date(shop.subscriptionExpiresAt).getTime() > now.getTime()
          ? new Date(shop.subscriptionExpiresAt)
          : now;
      newExpiresAt = new Date(currentExpiry.getTime() + 30 * 24 * 60 * 60 * 1000);
    }

    const previousExpiry = shop.subscriptionExpiresAt;
    shop.subscriptionExpiresAt = newExpiresAt;

    if (data.startDate || data.newStartDate) {
      const parsedStart = new Date(data.startDate || data.newStartDate);
      if (!isNaN(parsedStart.getTime())) {
        shop.subscriptionStartDate = parsedStart;
      }
    }

    // Resolve Status
    if (data.newStatus) {
      shop.subscriptionStatus = data.newStatus;
    } else {
      shop.subscriptionStatus = this.calculateStatus(shop, now);
    }

    // If newly extended expiry is in the future, unblock session
    if (newExpiresAt.getTime() > now.getTime()) {
      shop.sessionInvalidatedAt = null;
    }

    // Reset notification tracker for newly extended date
    shop.subscriptionNotificationsSent = [];

    if (data.planId) {
      const plan = await Plan.findById(data.planId);
      if (plan) {
        shop.planId = plan._id;
        shop.subscription = plan.name;
        if (plan.allowedModules?.length) {
          shop.enabledModules = plan.allowedModules;
        }
      }
    }

    const extendedByActor = req?.user?.name || req?.user?.email || 'Super Admin';
    const reasonText = data.reason || data.notes || 'Super Admin manual validity extension';

    // Add to History preserving previous records
    if (!shop.subscriptionHistory) shop.subscriptionHistory = [];
    shop.subscriptionHistory.unshift({
      planId: shop.planId,
      planName: shop.subscription,
      startDate: shop.subscriptionStartDate || now,
      expiresAt: newExpiresAt,
      previousExpiresAt: previousExpiry,
      billingCycle: shop.subscriptionBillingCycle || 'monthly',
      amount: Number(data.amount) || 0,
      paymentStatus: 'PAID',
      paymentMethod: data.paymentMethod || 'Super Admin Override',
      referenceId: `ADM-EXT-${Date.now()}`,
      renewedAt: now,
      renewedBy: 'SUPER_ADMIN',
      extendedBy: extendedByActor,
      reason: reasonText,
      notes: reasonText,
    });

    await shop.save();

    const daysExtended = Math.round(
      (newExpiresAt.getTime() - (previousExpiry ? new Date(previousExpiry).getTime() : now.getTime())) /
        (24 * 60 * 60 * 1000)
    );

    // Audit Log
    await auditLogService.recordActivity({
      req,
      action: 'SUBSCRIPTION_EXTENDED',
      category: 'Subscription',
      targetType: 'Workshop',
      targetId: shop._id,
      targetName: shop.name,
      performedBy: extendedByActor,
      reason: reasonText,
      status: 'SUCCESS',
      details: {
        previousExpiry,
        newExpiresAt,
        daysExtended,
        status: shop.subscriptionStatus,
        extendedBy: extendedByActor,
      },
    });

    return {
      success: true,
      message: `Subscription extended until ${newExpiresAt.toLocaleDateString()}`,
      shop,
      newExpiresAt,
      daysExtended,
      daysRemaining: this.getDaysRemaining(shop, now),
    };
  }
}

export const subscriptionService = new SubscriptionService();
export const checkAndExpireSubscriptions = () => subscriptionService.checkAndExpireSubscriptions();
