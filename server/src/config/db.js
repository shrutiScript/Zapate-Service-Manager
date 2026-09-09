import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

export async function connectDB() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/repairflow_db';
  try {
    const conn = await mongoose.connect(mongoUri);
    console.log(`[MongoDB] Connected successfully: ${conn.connection.host}`);
    await seedDefaultData();
    return conn;
  } catch (error) {
    console.warn(`[MongoDB] Warning: Could not connect to MongoDB at ${mongoUri}. Operating in in-memory resilience mode. Error: ${error.message}`);
    return null;
  }
}

async function seedDefaultData() {
  try {
    const { User } = await import('../modules/users/user.model.js');
    const { Shop } = await import('../modules/shops/shop.model.js');
    const { Plan } = await import('../modules/admin/plan.model.js');
    const { GlobalBrand } = await import('../modules/admin/globalBrand.model.js');
    const { GlobalCategory } = await import('../modules/admin/globalCategory.model.js');

    // Clean up any stale legacy indexes
    try {
      const shopIndexes = await Shop.collection.indexes();
      for (const idx of shopIndexes) {
        if (idx.name === 'email_1') {
          await Shop.collection.dropIndex('email_1').catch(() => {});
        }
      }
    } catch (e) {}

    // 1. Seed Plans if empty
    const planCount = await Plan.countDocuments();
    if (planCount === 0) {
      await Plan.create([
        {
          name: 'Starter',
          price: 1499,
          billingCycle: 'monthly',
          allowedModules: ['customers', 'repairs', 'devices', 'technicians', 'pos', 'payments'],
          maxUsers: 3,
          maxTechnicians: 2,
          description: 'Essential toolkit for single workbench workshops.',
          active: true,
        },
        {
          name: 'Professional',
          price: 3499,
          billingCycle: 'monthly',
          allowedModules: [
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
            'notifications',
            'reports',
            'settings',
          ],
          maxUsers: 10,
          maxTechnicians: 6,
          description: 'Complete operating system for growing mobile repair labs.',
          active: true,
        },
        {
          name: 'Enterprise',
          price: 6999,
          billingCycle: 'monthly',
          allowedModules: [
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
            'notifications',
            'reports',
            'settings',
          ],
          maxUsers: 50,
          maxTechnicians: 25,
          description: 'Multi-branch enterprise repair operations.',
          active: true,
        },
      ]);
      console.log('[Seed] Subscription plans seeded.');
    }

    // 2. Seed / Update Super Admin (admin@gmail.com / 123456)
    const adminPasswordHash = await bcrypt.hash('123456', 10);
    const superAdmin = await User.findOne({
      $or: [{ email: 'admin@gmail.com' }, { role: 'SUPER_ADMIN' }, { userId: 'ADM-001' }],
    });
    if (!superAdmin) {
      await User.create({
        userId: 'ADM-001',
        name: 'Super Admin',
        email: 'admin@gmail.com',
        mobile: '9900000000',
        password: adminPasswordHash,
        role: 'SUPER_ADMIN',
        status: 'ACTIVE',
        onboardingCompleted: true,
        loginCount: 0,
      });
      console.log('[Seed] Super Admin (admin@gmail.com / 123456) seeded.');
    } else {
      if (!superAdmin.password) {
        superAdmin.password = adminPasswordHash;
      }
      superAdmin.status = 'ACTIVE';
      superAdmin.onboardingCompleted = true;
      await superAdmin.save();
      console.log('[Seed] Super Admin (admin@gmail.com) verified and active.');
    }

    // Normalize any existing active records in database to standard uppercase 'ACTIVE'
    await User.updateMany({ status: { $in: ['Active', 'active', 'ACTIVE'] } }, { $set: { status: 'ACTIVE' } });
    await Shop.updateMany({ status: { $in: ['Active', 'active', 'ACTIVE'] } }, { $set: { status: 'ACTIVE' } });

    // Backfill any legacy shop documents with missing required fields
    const shopsWithoutCode = await Shop.find({ $or: [{ code: { $exists: false } }, { code: null }, { ownerEmail: { $exists: false } }] });
    for (const s of shopsWithoutCode) {
      s.code = s.code || `SH-${Math.floor(1000 + Math.random() * 9000)}`;
      s.ownerEmail = s.ownerEmail || s.email || 'owner@workshop.in';
      s.ownerMobile = s.ownerMobile || s.mobile || '9845011223';
      s.onboardingCompleted = true;
      await s.save();
    }

    // 4. Seed Global Brands & Categories
    const brandCount = await GlobalBrand.countDocuments();
    if (brandCount === 0) {
      await GlobalBrand.create([
        { name: 'Apple', code: 'AAPL', modelsCount: 38, active: true },
        { name: 'Samsung', code: 'SAMS', modelsCount: 52, active: true },
        { name: 'Google Pixel', code: 'GOOG', modelsCount: 14, active: true },
        { name: 'OnePlus', code: '1PLS', modelsCount: 22, active: true },
        { name: 'Xiaomi', code: 'MI', modelsCount: 45, active: true },
        { name: 'Vivo', code: 'VIVO', modelsCount: 30, active: true },
        { name: 'Oppo', code: 'OPPO', modelsCount: 28, active: true },
        { name: 'Nothing', code: 'NOTH', modelsCount: 4, active: true },
      ]);
      console.log('[Seed] Global device brands seeded.');
    }

    const catCount = await GlobalCategory.countDocuments();
    if (catCount === 0) {
      await GlobalCategory.create([
        { name: 'Displays & Screens', code: 'CAT-SCR', active: true },
        { name: 'OEM Batteries', code: 'CAT-BAT', active: true },
        { name: 'Charging Ports & Sub-Boards', code: 'CAT-CHG', active: true },
        { name: 'Camera Modules & Glass', code: 'CAT-CAM', active: true },
        { name: 'Housings & Back Glass', code: 'CAT-HSG', active: true },
        { name: 'Motherboard ICs & Flex', code: 'CAT-IC', active: true },
        { name: 'Accessories & Tempered', code: 'CAT-ACC', active: true },
      ]);
      console.log('[Seed] Global categories seeded.');
    }
  } catch (err) {
    console.error('[Seed] Error during seeding:', err.message);
  }
}
