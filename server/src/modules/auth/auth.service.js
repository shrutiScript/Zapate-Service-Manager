import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../users/user.model.js';
import { Shop } from '../shops/shop.model.js';
import { LoginActivity } from '../admin/loginActivity.model.js';
import { auditLogService } from '../admin/auditLog.service.js';

export class AuthService {
  async login(identifier, password, reqInfo = {}) {
    if (!identifier || !password) {
      const err = new Error('User ID and Password are required.');
      err.statusCode = 400;
      throw err;
    }

    const trimmed = identifier.trim().toLowerCase();

    // Check if identifier matches Super Admin aliases (e.g. 'admin', 'admin@gmail.com', 'ADM-001')
    const isSuperAdminAlias = ['admin', 'admin@gmail.com', 'adm-001'].includes(trimmed);

    // 1. Find user by email, mobile, userId, or super admin alias
    let user = await User.findOne({
      $or: [
        { email: trimmed },
        { mobile: identifier.trim() },
        { userId: identifier.trim().toUpperCase() },
        ...(isSuperAdminAlias ? [{ email: 'admin@gmail.com' }, { role: 'SUPER_ADMIN' }, { userId: 'ADM-001' }] : []),
      ],
    });

    // 2. Super Admin Seeded Fallback check if user does not exist in DB yet
    if (!user && isSuperAdminAlias && (password === '123456' || password === 'admin@123')) {
      const passwordHash = await bcrypt.hash('123456', 10);
      user = await User.create({
        userId: 'ADM-001',
        name: 'Super Admin',
        email: 'admin@gmail.com',
        mobile: '9900000000',
        password: passwordHash,
        role: 'SUPER_ADMIN',
        status: 'ACTIVE',
        onboardingCompleted: true,
        loginCount: 0,
      });
    }

    if (!user) {
      // Record failed authentication audit log
      auditLogService.recordActivity({
        action: 'LOGIN_FAILED',
        category: 'Authentication',
        targetType: 'User',
        targetName: identifier.trim(),
        performedBy: identifier.trim(),
        reason: 'User account not found',
        status: 'FAILED',
        req: { ip: reqInfo.ip, headers: { 'user-agent': reqInfo.userAgent } },
      });

      const err = new Error('Invalid User ID or Password.');
      err.statusCode = 401;
      throw err;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      // Record failed authentication audit log
      auditLogService.recordActivity({
        action: 'LOGIN_FAILED',
        category: 'Authentication',
        targetType: 'User',
        targetId: user._id,
        targetName: user.name || user.email,
        performedBy: user.email,
        performedById: user._id,
        reason: 'Invalid password provided',
        status: 'FAILED',
        req: { ip: reqInfo.ip, headers: { 'user-agent': reqInfo.userAgent }, user },
      });

      const err = new Error('Invalid User ID or Password.');
      err.statusCode = 401;
      throw err;
    }

    // Validate Account Status
    if ((user.status || '').toUpperCase() === 'BLOCKED') {
      const err = new Error('Your workshop account has been blocked by the administrator. Please contact support.');
      err.statusCode = 403;
      err.isBlocked = true;
      throw err;
    }

    // Validate Attached Shop Status for non-admin users
    if (user.role !== 'SUPER_ADMIN' && user.shopId) {
      const attachedShop = await Shop.findById(user.shopId);
      if (attachedShop && (attachedShop.status || '').toUpperCase() === 'BLOCKED') {
        const err = new Error('Your workshop account has been blocked by the administrator. Please contact support.');
        err.statusCode = 403;
        err.isBlocked = true;
        throw err;
      }
    }

    // Update Login Analytics
    user.lastLogin = new Date();
    user.loginCount = (user.loginCount || 0) + 1;
    await user.save();

    // Fetch attached Shop info
    let shop = null;
    if (user.shopId) {
      shop = await Shop.findByIdAndUpdate(
        user.shopId,
        { lastLogin: new Date(), $inc: { loginCount: 1 } },
        { new: true }
      );
    }

    // Record Login Activity in MongoDB
    try {
      await LoginActivity.create({
        userId: user._id,
        userName: user.name,
        email: user.email,
        role: user.role,
        shopId: user.shopId || null,
        shopName: shop ? shop.name : null,
        loginAt: new Date(),
        ipAddress: reqInfo.ip || '127.0.0.1',
        userAgent: reqInfo.userAgent || '',
      });
    } catch (e) {}

    // Record Audit Log if Super Admin
    if (user.role === 'SUPER_ADMIN') {
      auditLogService.recordActivity({
        action: 'LOGIN',
        category: 'Authentication',
        targetType: 'Security',
        targetId: user._id,
        targetName: 'Super Admin Session',
        performedBy: user.name,
        performedById: user._id,
        status: 'SUCCESS',
        req: { ip: reqInfo.ip, headers: { 'user-agent': reqInfo.userAgent }, user },
      });
    }

    const token = this.generateToken(user);
    return {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        role: user.role, // 'SUPER_ADMIN' or 'SHOP_OWNER'
        shopId: user.shopId,
        shopName: shop ? shop.name : null,
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
        } : null,
        onboardingCompleted:
          user.role === 'SUPER_ADMIN'
            ? true
            : Boolean(user.onboardingCompleted === true && shop && shop.onboardingCompleted === true && shop.logo && shop.addressLine1),
        enabledModules: shop ? shop.enabledModules : undefined,
        status: (user.status || 'ACTIVE').toUpperCase(),
      },
    };
  }

  async register(data) {
    const name = (data.name || '').trim();
    const shopName = (data.shopName || '').trim();
    const email = (data.email || '').toLowerCase().trim();
    const mobile = (data.mobile || '').trim();
    const password = data.password;

    if (!name || !shopName || !email || !mobile || !password) {
      throw new Error('Full Name, Shop Name, Email, Mobile and Password are all required.');
    }

    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters long.');
    }

    // Duplicate Email Check
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      const err = new Error('Account already exists. Please sign in to continue.');
      err.statusCode = 409;
      err.isDuplicate = true;
      err.duplicateField = 'email';
      err.existingValue = email;
      throw err;
    }

    // Duplicate Mobile Check
    const existingMobile = await User.findOne({ mobile });
    if (existingMobile) {
      const err = new Error('Account already exists. Please sign in to continue.');
      err.statusCode = 409;
      err.isDuplicate = true;
      err.duplicateField = 'mobile';
      err.existingValue = mobile;
      throw err;
    }

    // Generate unique shop code (e.g. SH-7492)
    const uniqueCode = `SH-${Math.floor(1000 + Math.random() * 9000)}`;

    const defaultModules = [
      'customers',
      'repairs',
      'devices',
      'pos',
      'payments',
      'inventory',
      'suppliers',
      'purchases',
      'used-mobiles',
      'notifications',
      'reports',
      'settings',
    ];

    // Create unique Shop immediately ACTIVE with onboardingCompleted = false
    const shop = await Shop.create({
      code: uniqueCode,
      name: shopName,
      ownerName: name,
      ownerEmail: email,
      ownerMobile: mobile,
      shopContactNumber: mobile,
      businessEmail: email,
      status: 'ACTIVE',
      onboardingCompleted: false,
      loginCount: 0,
      enabledModules: defaultModules,
    });

    const passwordHash = await bcrypt.hash(password, 10);

    // Create unique User immediately ACTIVE with onboardingCompleted = false
    const user = await User.create({
      userId: `OWN-${Date.now().toString().slice(-4)}`,
      name: name,
      email: email,
      mobile: mobile,
      password: passwordHash,
      role: 'SHOP_OWNER',
      shopId: shop._id,
      status: 'ACTIVE',
      onboardingCompleted: false,
      loginCount: 0,
    });

    return {
      success: true,
      message: 'Registration successful! Please sign in to continue.',
      data: {
        userId: user.userId,
        name: user.name,
        shopCode: shop.code,
        shopName: shop.name,
        onboardingCompleted: false,
      },
    };
  }

  generateToken(user) {
    const secret = process.env.JWT_SECRET || 'super_secret_jwt_repairflow_2026';
    return jwt.sign(
      {
        id: user._id,
        email: user.email,
        role: user.role,
        shopId: user.shopId,
      },
      secret,
      { expiresIn: '7d' }
    );
  }
}
