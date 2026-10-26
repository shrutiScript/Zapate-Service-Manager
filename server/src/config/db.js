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

    // 1. Seed or Normalize Plans
    const planCount = await Plan.countDocuments();
    if (planCount === 0) {
      await Plan.create([
        {
          name: 'Starter Tier',
          price: 999,
          yearlyPrice: 799,
          billingCycle: 'monthly',
          allowedModules: ['customers', 'repairs', 'devices', 'technicians', 'pos', 'payments'],
          limitUsers: 2,
          limitTechs: 2,
          maxUsers: 2,
          maxTechnicians: 2,
          repairTicketLimit: 50,
          supportLevel: 'Standard Support',
          features: ['Dashboard & CRM', 'Repair Tickets (Max 50/mo)', 'POS Billing', 'Standard Support'],
          badge: 'Single Tech & Counter',
          description: 'Great for independent technicians and single-counter repair shops.',
          isPopular: false,
          active: true,
          sortOrder: 1,
        },
        {
          name: 'Professional Tier',
          price: 2499,
          yearlyPrice: 1999,
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
            'users',
          ],
          limitUsers: 6,
          limitTechs: 5,
          maxUsers: 6,
          maxTechnicians: 5,
          repairTicketLimit: -1,
          supportLevel: 'Priority Support',
          features: [
            'Unlimited Repair Tickets',
            'Full Parts Inventory Matrix',
            'Supplier Procurement POs',
            'SMS & WhatsApp Hub',
            'Priority Support',
          ],
          badge: 'Most Popular',
          description: 'The complete toolkit for busy repair shops and multi-bench teams.',
          isPopular: true,
          active: true,
          sortOrder: 2,
        },
        {
          name: 'Enterprise Tier',
          price: 4999,
          yearlyPrice: 3999,
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
            'users',
          ],
          limitUsers: -1,
          limitTechs: -1,
          maxUsers: -1,
          maxTechnicians: -1,
          repairTicketLimit: -1,
          supportLevel: 'Dedicated Account Manager',
          features: [
            'Multi-Branch Support',
            'Used Mobile Marketplace',
            'Automated Financial Ledger',
            'Custom Domain & Invoicing',
            'Dedicated Account Manager',
          ],
          badge: 'Franchise & Multi-Branch',
          description: 'Built for service franchises and multi-branch electronics chains.',
          isPopular: false,
          active: true,
          sortOrder: 3,
        },
      ]);
      console.log('[Seed] Subscription plans seeded.');
    } else {
      // Normalize existing plans in database
      const existingPlans = await Plan.find();
      let hasPopular = existingPlans.some((p) => p.isPopular);

      for (const p of existingPlans) {
        let modified = false;
        const norm = p.name.trim().toLowerCase();

        if (norm === 'starter' || norm === 'starter tier') {
          p.name = 'Starter Tier';
          p.price = p.price || 999;
          p.yearlyPrice = p.yearlyPrice || 799;
          p.limitUsers = p.limitUsers ?? 2;
          p.limitTechs = p.limitTechs ?? 2;
          p.repairTicketLimit = p.repairTicketLimit ?? 50;
          p.supportLevel = p.supportLevel || 'Standard Support';
          if (!p.features || p.features.length === 0) {
            p.features = ['Dashboard & CRM', 'Repair Tickets (Max 50/mo)', 'POS Billing', 'Standard Support'];
          }
          p.sortOrder = 1;
          modified = true;
        } else if (norm === 'professional' || norm === 'professional tier') {
          p.name = 'Professional Tier';
          p.price = p.price || 2499;
          p.yearlyPrice = p.yearlyPrice || 1999;
          p.limitUsers = p.limitUsers ?? 6;
          p.limitTechs = p.limitTechs ?? 5;
          p.repairTicketLimit = p.repairTicketLimit ?? -1;
          p.supportLevel = p.supportLevel || 'Priority Support';
          if (!p.features || p.features.length === 0) {
            p.features = [
              'Unlimited Repair Tickets',
              'Full Parts Inventory Matrix',
              'Supplier Procurement POs',
              'SMS & WhatsApp Hub',
              'Priority Support',
            ];
          }
          if (!hasPopular) {
            p.isPopular = true;
            hasPopular = true;
          }
          p.sortOrder = 2;
          modified = true;
        } else if (norm === 'enterprise' || norm === 'enterprise tier') {
          p.name = 'Enterprise Tier';
          p.price = p.price || 4999;
          p.yearlyPrice = p.yearlyPrice || 3999;
          p.limitUsers = p.limitUsers ?? -1;
          p.limitTechs = p.limitTechs ?? -1;
          p.repairTicketLimit = p.repairTicketLimit ?? -1;
          p.supportLevel = p.supportLevel || 'Dedicated Account Manager';
          if (!p.features || p.features.length === 0) {
            p.features = [
              'Multi-Branch Support',
              'Used Mobile Marketplace',
              'Automated Financial Ledger',
              'Custom Domain & Invoicing',
              'Dedicated Account Manager',
            ];
          }
          p.sortOrder = 3;
          modified = true;
        } else {
          if (!p.features || p.features.length === 0) {
            p.features = ['Standard POS Billing', 'CRM & Customer Directory', 'Thermal Receipt Printing'];
            modified = true;
          }
          if (p.limitUsers === undefined) {
            p.limitUsers = p.maxUsers ?? 2;
            modified = true;
          }
          if (p.limitTechs === undefined) {
            p.limitTechs = p.maxTechnicians ?? 2;
            modified = true;
          }
          if (p.repairTicketLimit === undefined) {
            p.repairTicketLimit = -1;
            modified = true;
          }
        }

        if (modified) {
          await p.save();
        }
      }

      // Link any existing shops to plan documents if planId is missing
      const freshPlans = await Plan.find();
      const shopsNeedingPlanId = await Shop.find({ $or: [{ planId: null }, { planId: { $exists: false } }] });
      for (const s of shopsNeedingPlanId) {
        const subName = (s.subscription || '').toLowerCase().trim();
        const baseSub = subName.replace(/\s+tier$/i, '');
        const matched = freshPlans.find((p) => {
          const pName = p.name.toLowerCase().trim();
          const pBase = pName.replace(/\s+tier$/i, '');
          return pName === subName || pBase === baseSub;
        });
        if (matched) {
          s.planId = matched._id;
          s.subscription = matched.name;
          await s.save();
        }
      }

      // ── NORMALIZE WORKSHOP SUBSCRIPTION DATES & LIFECYCLE ──
      const allShops = await Shop.find();
      const now = new Date();
      for (const s of allShops) {
        let changed = false;
        if (!s.subscriptionStartDate) {
          s.subscriptionStartDate = s.createdAt || now;
          changed = true;
        }
        if (!s.subscriptionBillingCycle) {
          s.subscriptionBillingCycle = 'monthly';
          changed = true;
        }
        if (!s.subscriptionPaymentStatus) {
          s.subscriptionPaymentStatus = 'PAID';
          changed = true;
        }
        if (!s.subscriptionExpiresAt) {
          const durationDays = s.subscriptionBillingCycle === 'yearly' ? 365 : s.subscriptionBillingCycle === 'quarterly' ? 90 : 30;
          let calculatedExpiry = new Date(s.subscriptionStartDate.getTime() + durationDays * 24 * 60 * 60 * 1000);
          // For existing test shops, guarantee active validity (15 days from now)
          if (calculatedExpiry < now) {
            calculatedExpiry = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000);
          }
          s.subscriptionExpiresAt = calculatedExpiry;
          changed = true;
        }

        // Calculate subscriptionStatus
        const expiry = new Date(s.subscriptionExpiresAt);
        let status = 'ACTIVE';
        if (now.getTime() >= expiry.getTime()) {
          status = 'EXPIRED';
        } else if (expiry.getTime() - now.getTime() <= 7 * 24 * 60 * 60 * 1000) {
          status = 'EXPIRING_SOON';
        }
        if (s.status === 'BLOCKED' || s.status === 'SUSPENDED') {
          status = 'SUSPENDED';
        }
        if (s.subscriptionStatus !== status) {
          s.subscriptionStatus = status;
          changed = true;
        }

        if (!s.subscriptionHistory || s.subscriptionHistory.length === 0) {
          s.subscriptionHistory = [
            {
              planId: s.planId,
              planName: s.subscription || 'Starter Tier',
              startDate: s.subscriptionStartDate,
              expiresAt: s.subscriptionExpiresAt,
              billingCycle: s.subscriptionBillingCycle,
              amount: 999,
              paymentStatus: 'PAID',
              paymentMethod: 'Initial Subscription',
              referenceId: `SUB-${s.code || s._id.toString().slice(-4)}`,
              renewedAt: s.createdAt || now,
              renewedBy: 'SYSTEM',
              notes: 'Initial workshop subscription tier setup',
            },
          ];
          changed = true;
        }

        if (changed) {
          await s.save();
        }
      }

      console.log('[Seed] Subscription plans and shop subscriptions normalized.');
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
