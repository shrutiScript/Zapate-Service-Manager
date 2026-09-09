import { ActivityLog } from './activityLog.model.js';
import { Shop } from '../shops/shop.model.js';

// Sensitive keys that must never be recorded in audit logs
const SENSITIVE_KEYS = new Set([
  'password',
  'passwordHash',
  'token',
  'jwt',
  'secret',
  'rf_auth_token',
  'creditCard',
  'cvv',
  'pin',
  '__v',
]);

/**
 * Sanitize object to remove sensitive or internal fields
 */
function sanitizeData(data) {
  if (!data || typeof data !== 'object') return data;
  if (Array.isArray(data)) return data.map(sanitizeData);

  const clean = {};
  for (const [key, value] of Object.entries(data)) {
    if (SENSITIVE_KEYS.has(key)) continue;
    if (value && typeof value === 'object' && !(value instanceof Date)) {
      clean[key] = sanitizeData(value);
    } else {
      clean[key] = value;
    }
  }
  return clean;
}

/**
 * Compute array of top-level keys that actually changed between previous and new state
 */
function computeChangedFields(prev, next) {
  if (!prev || !next || typeof prev !== 'object' || typeof next !== 'object') {
    return [];
  }

  const changed = new Set();
  const allKeys = new Set([...Object.keys(prev), ...Object.keys(next)]);

  for (const key of allKeys) {
    if (SENSITIVE_KEYS.has(key) || key === '_id' || key === 'updatedAt' || key === 'createdAt') {
      continue;
    }

    const valA = prev[key];
    const valB = next[key];

    // Deep compare JSON representations for simple diff
    const strA = JSON.stringify(valA !== undefined ? valA : null);
    const strB = JSON.stringify(valB !== undefined ? valB : null);

    if (strA !== strB) {
      changed.add(key);
    }
  }

  return Array.from(changed);
}

export class AuditLogService {
  /**
   * Automatically record an administrative action
   */
  async recordActivity({
    req = null,
    action,
    category,
    targetType,
    targetId = null,
    targetName = '—',
    previousData = null,
    newData = null,
    reason = null,
    status = 'SUCCESS',
    performedBy = null,
    performedById = null,
  }) {
    try {
      // Determine actor details
      let actorName = performedBy;
      let actorId = performedById;

      if (req && req.user) {
        actorName = req.user.name || (req.user.role === 'SUPER_ADMIN' ? 'Super Admin' : actorName);
        actorId = req.user._id || req.user.id || actorId;
      }
      if (!actorName) {
        actorName = 'Super Admin';
      }

      // Extract client IP & User Agent
      let ipAddress = '127.0.0.1';
      let userAgent = '';

      if (req) {
        ipAddress =
          req.ip ||
          req.headers?.['x-forwarded-for']?.split(',')[0]?.trim() ||
          req.connection?.remoteAddress ||
          '127.0.0.1';
        userAgent = req.headers?.['user-agent'] || '';
      }

      // Sanitize diff states
      const cleanPrevious = sanitizeData(
        previousData?.toObject ? previousData.toObject() : previousData
      );
      const cleanNew = sanitizeData(
        newData?.toObject ? newData.toObject() : newData
      );
      const changedFields = computeChangedFields(cleanPrevious, cleanNew);

      // Create log record
      const log = await ActivityLog.create({
        action: String(action).toUpperCase(),
        category,
        targetType,
        targetId: targetId ? String(targetId) : null,
        targetName: String(targetName || '—').trim(),
        previousData: cleanPrevious,
        newData: cleanNew,
        changedFields,
        performedBy: actorName,
        performedById: actorId,
        reason: reason ? String(reason).trim() : null,
        status: status === 'FAILED' ? 'FAILED' : 'SUCCESS',
        ipAddress,
        userAgent,
      });

      return log;
    } catch (err) {
      console.error('[AuditLogService] Failed to record audit log:', err.message);
      return null;
    }
  }

  /**
   * Query activity logs with filtering, search, pagination, and KPI metrics
   */
  async getActivityLogs(query = {}) {
    const filter = {};

    // Category Filter
    if (query.category && query.category !== 'All Actions' && query.category !== 'ALL') {
      filter.category = query.category;
    }

    // Action Type Filter
    if (query.actionType && query.actionType !== 'All' && query.actionType !== 'ALL') {
      const type = String(query.actionType).toUpperCase();
      filter.action = { $regex: type, $options: 'i' };
    }

    // Status Filter
    if (query.status && query.status !== 'All' && query.status !== 'ALL') {
      filter.status = query.status.toUpperCase();
    }

    // Date Range Filter
    const now = new Date();
    if (query.dateRange === 'today') {
      const startOfToday = new Date(now);
      startOfToday.setHours(0, 0, 0, 0);
      filter.createdAt = { $gte: startOfToday };
    } else if (query.dateRange === 'yesterday') {
      const startOfYesterday = new Date(now);
      startOfYesterday.setDate(startOfYesterday.getDate() - 1);
      startOfYesterday.setHours(0, 0, 0, 0);
      const endOfYesterday = new Date(now);
      endOfYesterday.setDate(endOfYesterday.getDate() - 1);
      endOfYesterday.setHours(23, 59, 59, 999);
      filter.createdAt = { $gte: startOfYesterday, $lte: endOfYesterday };
    } else if (query.dateRange === '7days') {
      const past7 = new Date(now);
      past7.setDate(past7.getDate() - 7);
      past7.setHours(0, 0, 0, 0);
      filter.createdAt = { $gte: past7 };
    } else if (query.dateRange === '30days') {
      const past30 = new Date(now);
      past30.setDate(past30.getDate() - 30);
      past30.setHours(0, 0, 0, 0);
      filter.createdAt = { $gte: past30 };
    } else if (query.startDate || query.endDate) {
      filter.createdAt = {};
      if (query.startDate) filter.createdAt.$gte = new Date(query.startDate);
      if (query.endDate) {
        const end = new Date(query.endDate);
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }

    // Multi-field Search
    if (query.search && query.search.trim()) {
      const term = query.search.trim();
      filter.$or = [
        { targetName: { $regex: term, $options: 'i' } },
        { action: { $regex: term, $options: 'i' } },
        { performedBy: { $regex: term, $options: 'i' } },
        { reason: { $regex: term, $options: 'i' } },
        { targetType: { $regex: term, $options: 'i' } },
      ];
    }

    // Pagination
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(query.limit, 10) || 15));
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      ActivityLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      ActivityLog.countDocuments(filter),
    ]);

    // KPI Summary Metrics
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    const past30Days = new Date(now);
    past30Days.setDate(past30Days.getDate() - 30);

    const [todayActions, blockedWorkshops, newWorkshops, securityActions] = await Promise.all([
      ActivityLog.countDocuments({ createdAt: { $gte: startOfToday } }),
      Shop.countDocuments({ status: 'BLOCKED' }),
      Shop.countDocuments({ createdAt: { $gte: past30Days } }),
      ActivityLog.countDocuments({
        category: { $in: ['Security', 'Authentication'] },
      }),
    ]);

    return {
      logs,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit) || 1,
      },
      metrics: {
        todayActions,
        blockedWorkshops,
        newWorkshops,
        securityActions,
      },
    };
  }

  /**
   * Get single activity log by ID
   */
  async getActivityLogById(id) {
    const log = await ActivityLog.findById(id);
    if (!log) throw new Error('Activity log not found');
    return log;
  }

  /**
   * Fetch recent actions for Super Admin dashboard widget
   */
  async getRecentAdminActions(limit = 8) {
    return ActivityLog.find({}).sort({ createdAt: -1 }).limit(limit);
  }
}

export const auditLogService = new AuditLogService();
