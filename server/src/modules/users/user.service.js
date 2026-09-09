import bcrypt from 'bcryptjs';
import { User } from './user.model.js';
import { auditLogService } from '../admin/auditLog.service.js';

export class UserService {
  async getAll(query = {}) {
    const filter = {};
    if (query.role) filter.role = query.role;
    if (query.shopId) filter.shopId = query.shopId;
    if (query.status) filter.status = query.status;
    return User.find(filter)
      .populate('shopId', 'name city status code')
      .select('-password')
      .sort({ createdAt: -1 });
  }

  async getById(id) {
    const user = await User.findById(id)
      .populate('shopId', 'name city status code')
      .select('-password');
    if (!user) throw new Error('User not found');
    return user;
  }

  async updateProfile(id, data, req = null) {
    const user = await User.findById(id);
    if (!user) throw new Error('User not found');

    const previous = user.toObject();

    if (data.name) user.name = data.name.trim();
    if (data.mobile) user.mobile = data.mobile.trim();
    if (data.email) user.email = data.email.toLowerCase().trim();

    await user.save();
    const updated = await User.findById(id).select('-password');

    if (req && req.user?.role === 'SUPER_ADMIN') {
      auditLogService.recordActivity({
        req,
        action: 'USER_UPDATED',
        category: 'User',
        targetType: 'User',
        targetId: user._id,
        targetName: user.name,
        previousData: previous,
        newData: updated,
      });
    }

    return updated;
  }

  async changePassword(id, { currentPassword, newPassword }, req = null) {
    const user = await User.findById(id);
    if (!user) throw new Error('User not found');

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) throw new Error('Current password is incorrect');

    user.password = await bcrypt.hash(newPassword, 10);
    user.sessionInvalidatedAt = new Date();
    await user.save();

    auditLogService.recordActivity({
      req,
      action: 'PASSWORD_RESET',
      category: 'Security',
      targetType: 'User',
      targetId: user._id,
      targetName: user.name || user.email,
      reason: 'User password changed',
      status: 'SUCCESS',
    });

    return true;
  }

  async resetPassword(id, newPassword = 'Password@123', req = null) {
    const user = await User.findById(id);
    if (!user) throw new Error('User not found');

    user.password = await bcrypt.hash(newPassword, 10);
    user.sessionInvalidatedAt = new Date();
    await user.save();

    if (req && req.user?.role === 'SUPER_ADMIN') {
      auditLogService.recordActivity({
        req,
        action: 'PASSWORD_RESET',
        category: 'Security',
        targetType: 'User',
        targetId: user._id,
        targetName: user.name || user.email,
        reason: 'Password reset by Super Admin',
        status: 'SUCCESS',
      });
    }

    return true;
  }

  async forceLogout(id, req = null) {
    const user = await User.findById(id);
    if (!user) throw new Error('User not found');

    user.sessionInvalidatedAt = new Date();
    await user.save();

    if (req && req.user?.role === 'SUPER_ADMIN') {
      auditLogService.recordActivity({
        req,
        action: 'FORCE_LOGOUT',
        category: 'Security',
        targetType: 'User',
        targetId: user._id,
        targetName: user.name || user.email,
        reason: 'Forced session termination by Super Admin',
        status: 'SUCCESS',
      });
    }

    return true;
  }

  async create(data, req = null) {
    const existing = await User.findOne({ email: data.email.toLowerCase() });
    if (existing) throw new Error('Email already registered');

    const passwordHash = await bcrypt.hash(data.password || 'admin@123', 10);
    const user = await User.create({
      userId: `USR-${Date.now().toString().slice(-4)}`,
      name: data.name,
      email: data.email.toLowerCase(),
      mobile: data.mobile,
      password: passwordHash,
      role: data.role === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : 'SHOP_OWNER',
      shopId: data.shopId || null,
      status: (data.status || 'ACTIVE').toUpperCase(),
    });

    const cleanUser = await User.findById(user._id).select('-password');

    if (req && req.user?.role === 'SUPER_ADMIN') {
      auditLogService.recordActivity({
        req,
        action: 'USER_CREATED',
        category: 'User',
        targetType: 'User',
        targetId: user._id,
        targetName: user.name,
        newData: cleanUser,
        reason: data.reason || 'User created by Super Admin',
      });
    }

    return cleanUser;
  }

  async update(id, data, req = null) {
    const previous = await User.findById(id).select('-password');
    if (!previous) throw new Error('User not found');

    if (data.password) {
      data.password = await bcrypt.hash(data.password, 10);
      data.sessionInvalidatedAt = new Date();
    }
    if (data.status) {
      data.status = String(data.status).toUpperCase();
      if (data.status === 'BLOCKED') {
        data.sessionInvalidatedAt = new Date();
      }
    }

    const updated = await User.findByIdAndUpdate(id, data, { new: true }).select('-password');

    if (req && req.user?.role === 'SUPER_ADMIN') {
      auditLogService.recordActivity({
        req,
        action: 'USER_UPDATED',
        category: 'User',
        targetType: 'User',
        targetId: updated._id,
        targetName: updated.name,
        previousData: previous,
        newData: updated,
        reason: data.reason || 'User details updated by Super Admin',
      });
    }

    return updated;
  }

  async toggleStatus(id, req = null) {
    const user = await User.findById(id);
    if (!user) throw new Error('User not found');

    const previousStatus = (user.status || 'ACTIVE').toUpperCase();
    const nextStatus = previousStatus === 'ACTIVE' ? 'BLOCKED' : 'ACTIVE';

    user.status = nextStatus;
    if (nextStatus === 'BLOCKED') {
      user.sessionInvalidatedAt = new Date();
    }
    await user.save();

    if (req && req.user?.role === 'SUPER_ADMIN') {
      auditLogService.recordActivity({
        req,
        action: nextStatus === 'BLOCKED' ? 'USER_BLOCKED' : 'USER_UNBLOCKED',
        category: 'User',
        targetType: 'User',
        targetId: user._id,
        targetName: user.name,
        previousData: { status: previousStatus },
        newData: { status: nextStatus },
        reason: req.body?.reason || `User account status set to ${nextStatus}`,
      });
    }

    return User.findById(id).select('-password');
  }

  async delete(id, req = null) {
    const user = await User.findById(id).select('-password');
    if (!user) throw new Error('User not found');

    await User.findByIdAndDelete(id);

    if (req && req.user?.role === 'SUPER_ADMIN') {
      auditLogService.recordActivity({
        req,
        action: 'USER_DELETED',
        category: 'User',
        targetType: 'User',
        targetId: user._id,
        targetName: user.name,
        previousData: user,
        reason: req.body?.reason || 'User deleted by Super Admin',
      });
    }

    return true;
  }
}
