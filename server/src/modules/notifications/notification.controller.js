import { NotificationService } from './notification.service.js';
import { sendSuccess, sendCreated } from '../../utils/response.js';

const notificationService = new NotificationService();

export class NotificationController {
  async getAll(req, res, next) {
    try {
      const notifications = await notificationService.getAll(req.shopId);
      return sendSuccess(res, notifications);
    } catch (err) {
      next(err);
    }
  }

  async send(req, res, next) {
    try {
      const notification = await notificationService.send(req.body, req.shopId);
      return sendCreated(res, notification, 'Notification dispatched');
    } catch (err) {
      next(err);
    }
  }

  async getTemplates(req, res, next) {
    try {
      const templates = await notificationService.getTemplates();
      return sendSuccess(res, templates);
    } catch (err) {
      next(err);
    }
  }

  async delete(req, res, next) {
    try {
      await notificationService.delete(req.params.id, req.shopId);
      return sendSuccess(res, null, 'Notification removed');
    } catch (err) {
      next(err);
    }
  }

  async markAsRead(req, res, next) {
    try {
      const notification = await notificationService.markAsRead(req.params.id, req.shopId);
      return sendSuccess(res, notification, 'Notification marked as read');
    } catch (err) {
      next(err);
    }
  }

  async markAllAsRead(req, res, next) {
    try {
      await notificationService.markAllAsRead(req.shopId);
      return sendSuccess(res, null, 'All notifications marked as read');
    } catch (err) {
      next(err);
    }
  }
}
