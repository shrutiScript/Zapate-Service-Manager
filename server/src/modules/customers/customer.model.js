import mongoose from 'mongoose';

const CustomerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    mobile: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    address: { type: String },
    city: { type: String, default: 'Bengaluru' },
    deviceBrand: { type: String, default: '' },
    deviceModel: { type: String, default: '' },
    estimatedServicePrice: { type: Number, default: 0, min: 0 },
    finalServicePrice: { type: Number, default: 0, min: 0 },
    notes: { type: String, default: '' },
    totalSpent: { type: Number, default: 0, min: 0 },
    totalRepairs: { type: Number, default: 0, min: 0 },
    pendingDue: { type: Number, default: 0, min: 0 },
    shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop' },
  },
  { timestamps: true }
);

export const Customer = mongoose.models.Customer || mongoose.model('Customer', CustomerSchema);
