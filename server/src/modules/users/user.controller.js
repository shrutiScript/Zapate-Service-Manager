import { UserService } from './user.service.js';
import { sendSuccess, sendCreated } from '../../utils/response.js';

const userService = new UserService();

export class UserController {
  async getAll(req, res, next) {
    try {
      const users = await userService.getAll(req.query);
      return sendSuccess(res, users);
    } catch (err) {
      next(err);
    }
  }

  async getById(req, res, next) {
    try {
      const user = await userService.getById(req.params.id);
      return sendSuccess(res, user);
    } catch (err) {
      next(err);
    }
  }

  async updateProfile(req, res, next) {
    try {
      const userId = req.user.id || req.user._id;
      const user = await userService.updateProfile(userId, req.body, req);
      return sendSuccess(res, user, 'Profile updated successfully');
    } catch (err) {
      next(err);
    }
  }

  async changePassword(req, res, next) {
    try {
      const userId = req.user.id || req.user._id;
      await userService.changePassword(userId, req.body, req);
      return sendSuccess(res, null, 'Password changed successfully');
    } catch (err) {
      next(err);
    }
  }

  async resetPassword(req, res, next) {
    try {
      const { newPassword } = req.body || {};
      await userService.resetPassword(req.params.id, newPassword, req);
      return sendSuccess(res, null, 'User password has been reset successfully');
    } catch (err) {
      next(err);
    }
  }

  async forceLogout(req, res, next) {
    try {
      await userService.forceLogout(req.params.id, req);
      return sendSuccess(res, null, 'User sessions invalidated successfully');
    } catch (err) {
      next(err);
    }
  }

  async toggleStatus(req, res, next) {
    try {
      const user = await userService.toggleStatus(req.params.id, req);
      return sendSuccess(res, user, `User account status updated to ${user.status}`);
    } catch (err) {
      next(err);
    }
  }

  async create(req, res, next) {
    try {
      const user = await userService.create(req.body, req);
      return sendCreated(res, user, 'User created successfully');
    } catch (err) {
      next(err);
    }
  }

  async update(req, res, next) {
    try {
      const user = await userService.update(req.params.id, req.body, req);
      return sendSuccess(res, user, 'User updated successfully');
    } catch (err) {
      next(err);
    }
  }

  async delete(req, res, next) {
    try {
      await userService.delete(req.params.id, req);
      return sendSuccess(res, null, 'User deleted successfully');
    } catch (err) {
      next(err);
    }
  }
}
