import mongoose from 'mongoose';

const ShopSchema = new mongoose.Schema(
  {
    code: { type: String, unique: true, required: true }, // e.g. SH-8492
    name: { type: String, required: true, trim: true },
    ownerName: { type: String, required: true, trim: true },
    ownerEmail: { type: String, required: true, lowercase: true, trim: true },
    ownerMobile: { type: String, required: true, trim: true },
    businessEmail: { type: String, default: '', trim: true },
    shopContactNumber: { type: String, default: '', trim: true },
    logo: { type: String, default: '' },
    
    // Location
    addressLine1: { type: String, default: '' },
    addressLine2: { type: String, default: '' },
    landmark: { type: String, default: '' },
    city: { type: String, default: '' },
    state: { type: String, default: '' },
    pincode: { type: String, default: '' },
    country: { type: String, default: 'India' },

    // Business Settings
    businessType: { type: String, default: 'Mobile Repair Workshop' },
    gstNumber: { type: String, default: '' },
    invoicePrefix: { type: String, default: 'INV-' },
    invoiceFooter: { type: String, default: 'Thank you for choosing our workshop! Warranty applies on replaced hardware.' },
    termsAndConditions: {
      type: String,
      default:
        '1. Device must be collected within 10 days.\n2. Physical damage and water damage are not covered under warranty.\n3. Warranty is not applicable if another technician opens or repairs the device.\n4. Data loss is not the responsibility of the workshop.',
    },
    warrantyDays: { type: Number, default: 30 },

    onboardingCompleted: { type: Boolean, default: false },
    status: { type: String, enum: ['ACTIVE', 'INACTIVE', 'BLOCKED', 'SUSPENDED'], default: 'ACTIVE' },
    blockedReason: { type: String, default: null },
    blockedAt: { type: Date, default: null },
    sessionInvalidatedAt: { type: Date, default: null },

    // Subscription & Licensing Architecture
    planId: { type: mongoose.Schema.Types.ObjectId, ref: 'Plan', default: null },
    subscription: { type: String, default: 'Starter Tier' },
    subscriptionStartDate: { type: Date, default: Date.now },
    subscriptionExpiresAt: { type: Date, default: null },
    subscriptionStatus: {
      type: String,
      enum: ['ACTIVE', 'EXPIRING_SOON', 'EXPIRED', 'SUSPENDED'],
      default: 'ACTIVE',
    },
    subscriptionPaymentStatus: {
      type: String,
      enum: ['PAID', 'PENDING', 'FAILED', 'OVERDUE'],
      default: 'PAID',
    },
    subscriptionBillingCycle: {
      type: String,
      default: 'monthly',
    },
    subscriptionHistory: [
      {
        planId: { type: mongoose.Schema.Types.ObjectId, ref: 'Plan' },
        planName: { type: String, required: true },
        startDate: { type: Date, required: true },
        expiresAt: { type: Date, required: true },
        billingCycle: { type: String, default: 'monthly' },
        amount: { type: Number, default: 0 },
        paymentStatus: { type: String, enum: ['PAID', 'PENDING', 'FAILED'], default: 'PAID' },
        paymentMethod: { type: String, default: 'Online / Card' },
        referenceId: { type: String, default: '' },
        renewedAt: { type: Date, default: Date.now },
        renewedBy: { type: String, default: 'SYSTEM' }, // 'SUPER_ADMIN' | 'SHOP_OWNER' | 'SYSTEM'
        extendedBy: { type: String, default: '' },
        previousExpiresAt: { type: Date, default: null },
        reason: { type: String, default: '' },
        notes: { type: String, default: '' },
      },
    ],
    subscriptionNotificationsSent: [
      {
        event: {
          type: String,
          enum: [
            '7_DAYS',
            '6_DAYS',
            '5_DAYS',
            '4_DAYS',
            '3_DAYS',
            '2_DAYS',
            '1_DAY',
            'SHORT_DURATION_EXPIRING',
            'EXPIRED',
          ],
        },
        daysRemaining: { type: Number },
        expiresAt: { type: Date },
        sentAt: { type: Date, default: Date.now },
      },
    ],

    loginCount: { type: Number, default: 0 },
    lastLogin: { type: Date, default: null },

    enabledModules: {
      type: [String],
      default: [
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
      ],
    },
    currency: { type: String, default: '₹' },
  },
  { timestamps: true }
);

export const Shop = mongoose.models.Shop || mongoose.model('Shop', ShopSchema);
