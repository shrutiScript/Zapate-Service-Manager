import mongoose from 'mongoose';

const SettingsSchema = new mongoose.Schema(
  {
    shopName: { type: String, default: '' },
    ownerName: { type: String, default: '' },
    phone: { type: String, default: '' },
    email: { type: String, default: '' },
    address: { type: String, default: '' },
    gstin: { type: String, default: '' },
    taxPercentage: { type: Number, default: 18 },
    currencySymbol: { type: String, default: '₹' },
    invoicePrefix: { type: String, default: 'INV-' },
    jobCardPrefix: { type: String, default: 'RF-' },
    warrantyTerms: { type: String, default: 'Standard warranty on spare parts replacements.' },
    enableSmsAlerts: { type: Boolean, default: true },
    enableWhatsAppAlerts: { type: Boolean, default: true },
    shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop' },
  },
  { timestamps: true }
);

export const Settings = mongoose.models.Settings || mongoose.model('Settings', SettingsSchema);
