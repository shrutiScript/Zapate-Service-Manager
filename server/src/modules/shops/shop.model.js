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
    subscription: { type: String, default: 'Starter Tier' },
    loginCount: { type: Number, default: 0 },
    lastLogin: { type: Date, default: null },

    enabledModules: {
      type: [String],
      default: [
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
      ],
    },
    currency: { type: String, default: '₹' },
  },
  { timestamps: true }
);

export const Shop = mongoose.models.Shop || mongoose.model('Shop', ShopSchema);
