import { Shop } from '../modules/shops/shop.model.js';

export function requireModule(moduleName) {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    // Super Admin has universal access
    if (req.user.role === 'SUPER_ADMIN') {
      return next();
    }

    const shopId = req.user.shopId || req.shopId;
    if (!shopId) {
      return next();
    }

    try {
      const shop = await Shop.findById(shopId);
      if (!shop) {
        return res.status(404).json({ success: false, message: 'Associated repair shop not found' });
      }

      const shopStatus = String(shop.status || 'ACTIVE').trim().toUpperCase();
      if (shopStatus !== 'ACTIVE') {
        return res.status(403).json({ success: false, message: 'Shop workspace is inactive or suspended by Admin' });
      }

      const defaultModules = [
        'customers',
        'repairs',
        'devices',
        'technicians',
        'pos',
        'payments',
        'inventory',
        'suppliers',
        'purchases',
        'used-mobiles',
        'reports',
        'settings',
        'users',
        'warranties',
        'community',
        'notifications',
      ];

      const enabledModules = Array.isArray(shop.enabledModules) ? shop.enabledModules : defaultModules;
      if (!enabledModules.includes(moduleName)) {
        return res.status(403).json({
          success: false,
          message: `The '${moduleName}' module is currently disabled for your shop by Platform Admin.`,
          module: moduleName,
          disabled: true,
        });
      }

      req.shop = shop;
      next();
    } catch (err) {
      next(err);
    }
  };
}
