import { ReportService } from './report.service.js';
import { sendSuccess } from '../../utils/response.js';

const reportService = new ReportService();

export class ReportController {
  async getDashboardStats(req, res, next) {
    try {
      const stats = await reportService.getDashboardStats(req.shopId, req.role, req.query);
      return sendSuccess(res, stats);
    } catch (err) {
      next(err);
    }
  }

  async getReports(req, res, next) {
    try {
      const { type, range } = req.query;
      const reports = await reportService.getReports(type, range, req.shopId);
      return sendSuccess(res, reports);
    } catch (err) {
      next(err);
    }
  }

  async getAnalytics(req, res, next) {
    try {
      const { range } = req.query;
      const analytics = await reportService.getAnalytics(req.shopId, range);
      return sendSuccess(res, analytics);
    } catch (err) {
      next(err);
    }
  }

  async getCalendarDates(req, res, next) {
    try {
      const result = await reportService.getActiveCalendarDates(req.shopId, req.role, req.query);
      return sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }
}
