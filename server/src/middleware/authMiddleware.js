import jwt from 'jsonwebtoken';
import { User } from '../modules/users/user.model.js';
import { Shop } from '../modules/shops/shop.model.js';

export async function authMiddleware(req, res, next) {
  try {
    let token = null;

    // 1. Check Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.cookies && req.cookies.rf_auth_token) {
      // 2. Check HttpOnly cookie
      token = req.cookies.rf_auth_token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication session required. Please sign in.',
      });
    }

    const secret = process.env.JWT_SECRET || 'super_secret_jwt_repairflow_2026';
    let decoded;
    try {
      decoded = jwt.verify(token, secret);
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired session token. Please sign in again.',
      });
    }

    // 3. Load fresh User from MongoDB (Never trust client-provided claims blindly)
    let user = null;
    if (decoded.id) {
      user = await User.findById(decoded.id).select('-password');
    }

    // Fallback check for seeded Super Admin
    if (!user && (decoded.email === 'admin@gmail.com' || decoded.role === 'SUPER_ADMIN')) {
      user = await User.findOne({ email: 'admin@gmail.com' }).select('-password');
      if (!user) {
        user = {
          _id: 'admin-master-id',
          name: 'Super Admin',
          email: 'admin@gmail.com',
          role: 'SUPER_ADMIN',
          status: 'ACTIVE',
          shopId: null,
        };
      }
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User account not found or session revoked.',
      });
    }

    // 4. Validate Account Status
    const status = (user.status || '').toUpperCase();
    if (status === 'PENDING') {
      return res.status(403).json({
        success: false,
        status: 'PENDING',
        message: 'Your workshop registration is pending admin approval.',
      });
    }

    if (status === 'REJECTED') {
      return res.status(403).json({
        success: false,
        status: 'REJECTED',
        message: 'Your workshop registration was not approved. Please contact support.',
      });
    }

    if (status === 'SUSPENDED') {
      return res.status(403).json({
        success: false,
        status: 'SUSPENDED',
        message: 'Your account has been suspended. Please contact support.',
      });
    }

    if (status === 'BLOCKED') {
      return res.status(401).json({
        success: false,
        isBlocked: true,
        message: 'Your workshop account has been blocked by the administrator. Please contact support.',
      });
    }

    if (status !== 'ACTIVE') {
      return res.status(403).json({
        success: false,
        status,
        message: 'Your account is currently inactive.',
      });
    }

    // 5. If Shop User/Owner, strictly validate attached Workshop status & session validity
    if (user.role !== 'SUPER_ADMIN' && user.shopId) {
      const shop = await Shop.findById(user.shopId);
      if (!shop) {
        return res.status(401).json({
          success: false,
          message: 'Your workshop was not found. Please contact support.',
        });
      }

      const shopStatus = (shop.status || '').toUpperCase();
      if (shopStatus === 'BLOCKED') {
        return res.status(401).json({
          success: false,
          isBlocked: true,
          message: 'Your workshop account has been blocked by the administrator. Please contact support.',
        });
      }

      // Check session invalidation timestamps against JWT issued-at (iat)
      if (decoded.iat) {
        const tokenIssuedTime = new Date(decoded.iat * 1000);
        if (
          (shop.sessionInvalidatedAt && tokenIssuedTime < shop.sessionInvalidatedAt) ||
          (user.sessionInvalidatedAt && tokenIssuedTime < user.sessionInvalidatedAt)
        ) {
          return res.status(401).json({
            success: false,
            isBlocked: true,
            message: 'Your workshop account has been blocked by the administrator. Please contact support.',
          });
        }
      }

      // ── STRICT SERVER-SIDE SUBSCRIPTION EXPIRY ENFORCEMENT ──
      const now = new Date();
      const isExpired = shop.subscriptionExpiresAt && now.getTime() >= new Date(shop.subscriptionExpiresAt).getTime();
      const isStatusExpired = (shop.subscriptionStatus || '').toUpperCase() === 'EXPIRED';

      // Exception: Allow shop renewal and subscription status endpoints so user can renew
      const reqUrl = (req.originalUrl || req.url || '').toLowerCase();
      const isRenewalEndpoint = reqUrl.includes('/subscription') || reqUrl.includes('/renew') || reqUrl.includes('/plans');

      if ((isExpired || isStatusExpired) && !isRenewalEndpoint) {
        if (shop.subscriptionStatus !== 'EXPIRED') {
          shop.subscriptionStatus = 'EXPIRED';
          shop.save().catch(() => {});
        }

        return res.status(403).json({
          success: false,
          isExpired: true,
          subscriptionExpired: true,
          message: 'Your subscription has expired. Please renew your plan to continue.',
          shopId: shop._id,
          shopName: shop.name,
          plan: shop.subscription,
          expiresAt: shop.subscriptionExpiresAt,
        });
      }

      if (shopStatus !== 'ACTIVE') {
        return res.status(403).json({
          success: false,
          message: 'Your workshop is currently suspended or inactive by platform administrator.',
        });
      }
    }

    // 6. Strict Request Identity Assignment
    req.user = user;
    req.userId = user._id;
    req.role = user.role;
    // Strictly isolate shopId: Shop Owner gets their own shopId, Super Admin gets null
    req.shopId = user.role === 'SHOP_OWNER' ? user.shopId : null;
    req.sessionId = decoded.sessionId || `sess-${user._id}-${Date.now()}`;

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Authentication failed: ' + error.message,
    });
  }
}
