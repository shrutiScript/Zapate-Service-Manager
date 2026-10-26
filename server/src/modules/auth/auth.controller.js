import { AuthService } from './auth.service.js';
import { Shop } from '../shops/shop.model.js';
import { sendSuccess, sendCreated } from '../../utils/response.js';
import { auditLogService } from '../admin/auditLog.service.js';
import { subscriptionService } from '../shops/subscription.service.js';

const authService = new AuthService();

export class AuthController {
  async login(req, res, next) {
    try {
      const { identifier, email, mobile, userId, password } = req.body;
      const id = identifier || email || mobile || userId;
      const reqInfo = {
        ip: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1',
        userAgent: req.headers['user-agent'] || '',
      };
      const result = await authService.login(id, password, reqInfo);

      // Set secure HttpOnly session cookie (no maxAge -> cleared when browser session closes)
      res.cookie('rf_auth_token', result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
      });

      return sendSuccess(res, result, 'Login successful');
    } catch (err) {
      next(err);
    }
  }

  async register(req, res, next) {
    try {
      const result = await authService.register(req.body);
      return sendCreated(res, result, 'Registration successful! Please sign in to continue.');
    } catch (err) {
      next(err);
    }
  }

  async logout(req, res, next) {
    try {
      if (req.user && req.user.role === 'SUPER_ADMIN') {
        auditLogService.recordActivity({
          action: 'LOGOUT',
          category: 'Authentication',
          targetType: 'Security',
          targetId: req.user._id,
          targetName: 'Super Admin Session',
          performedBy: req.user.name,
          performedById: req.user._id,
          status: 'SUCCESS',
          req,
        });
      }

      res.clearCookie('rf_auth_token', {
        httpOnly: true,
        path: '/',
      });
      return sendSuccess(res, null, 'Logged out successfully');
    } catch (err) {
      next(err);
    }
  }

  async getMe(req, res, next) {
    try {
      const user = req.user;
      let shop = null;

      if (user.role === 'SHOP_OWNER' && user.shopId) {
        shop = await Shop.findById(user.shopId);
      }

      const now = new Date();
      const daysRemaining = shop ? subscriptionService.getDaysRemaining(shop, now) : 0;
      const calculatedStatus = shop ? subscriptionService.calculateStatus(shop, now) : 'ACTIVE';

      const verifiedIdentity = {
        id: user._id || user.id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        role: user.role, // 'SUPER_ADMIN' or 'SHOP_OWNER'
        shopId: user.role === 'SHOP_OWNER' ? user.shopId : null,
        shopName: shop ? shop.name : null,
        shopCode: shop ? shop.code : undefined,
        serverTime: now,
        shop: shop ? {
          id: shop._id,
          name: shop.name,
          ownerName: shop.ownerName,
          phone: shop.shopContactNumber || shop.ownerMobile || '',
          email: shop.businessEmail || shop.ownerEmail || '',
          address: [shop.addressLine1, shop.addressLine2, shop.landmark, shop.city, shop.state, shop.pincode].filter(Boolean).join(', ') || shop.addressLine1 || '',
          addressLine1: shop.addressLine1 || '',
          city: shop.city || '',
          state: shop.state || '',
          pincode: shop.pincode || '',
          logo: shop.logo || '',
          businessType: shop.businessType || 'Mobile Repair Workshop',
          gstNumber: shop.gstNumber || '',
          invoicePrefix: shop.invoicePrefix || '',
          termsAndConditions: shop.termsAndConditions || '',
          onboardingCompleted: shop.onboardingCompleted || false,
          subscription: shop.subscription,
          subscriptionStartDate: shop.subscriptionStartDate,
          subscriptionExpiresAt: shop.subscriptionExpiresAt,
          subscriptionStatus: calculatedStatus,
          subscriptionPaymentStatus: shop.subscriptionPaymentStatus,
          subscriptionBillingCycle: shop.subscriptionBillingCycle,
          daysRemaining,
          serverTime: now,
        } : null,
        onboardingCompleted:
          user.role === 'SUPER_ADMIN'
            ? true
            : Boolean(
                user.onboardingCompleted === true &&
                shop &&
                shop.onboardingCompleted === true &&
                shop.logo &&
                shop.addressLine1
              ),
        enabledModules: shop ? shop.enabledModules : undefined,
        loginCount: user.loginCount || 0,
        lastLogin: user.lastLogin,
        status: (user.status || 'ACTIVE').toUpperCase(),
      };

      return sendSuccess(res, verifiedIdentity, 'Verified session identity');
    } catch (err) {
      next(err);
    }
  }

  async forgotPassword(req, res, next) {
    try {
      const { identifier } = req.body;
      const reqInfo = {
        ip: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1',
        userAgent: req.headers['user-agent'] || '',
      };
      const result = await authService.forgotPassword(identifier, reqInfo);
      return sendSuccess(res, result, 'Verification code generated successfully.');
    } catch (err) {
      next(err);
    }
  }

  async verifyResetOtp(req, res, next) {
    try {
      const { identifier, otp } = req.body;
      const result = await authService.verifyResetOtp(identifier, otp);
      return sendSuccess(res, result, 'Verification code confirmed.');
    } catch (err) {
      next(err);
    }
  }

  async resetPassword(req, res, next) {
    try {
      const { identifier, otp, resetToken, newPassword } = req.body;
      const reqInfo = {
        ip: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1',
        userAgent: req.headers['user-agent'] || '',
      };
      const result = await authService.resetPassword({ identifier, otp, resetToken, newPassword }, reqInfo);
      return sendSuccess(res, result, 'Password reset successful.');
    } catch (err) {
      next(err);
    }
  }
}

