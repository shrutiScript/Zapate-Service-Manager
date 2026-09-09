import mongoose from 'mongoose';

const WarrantySchema = new mongoose.Schema(
  {
    repairJobId: { type: mongoose.Schema.Types.ObjectId, ref: 'JobCard' },
    repairNumber: { type: String, required: true, trim: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
    customerName: { type: String, required: true, trim: true },
    customerMobile: { type: String, required: true, trim: true },
    deviceBrand: { type: String, default: '' },
    deviceModel: { type: String, default: '' },
    imei: { type: String, default: '' },
    serviceWarrantyDays: { type: Number, default: 30, min: 0 },
    partsWarrantyDays: { type: Number, default: 30, min: 0 },
    startDate: { type: Date, default: Date.now },
    expiryDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ['ACTIVE', 'EXPIRING_SOON', 'EXPIRED', 'VOID'],
      default: 'ACTIVE',
    },
    totalAmount: { type: Number, default: 0 },
    paidAmount: { type: Number, default: 0 },
    dueAmount: { type: Number, default: 0 },
    paymentStatus: { type: String, enum: ['PAID', 'PARTIAL', 'PENDING'], default: 'PENDING' },
    warrantyEligible: { type: Boolean, default: false },
    terms: { type: String, default: '' },
    partsUsed: { type: Array, default: [] },
    repairDetails: { type: String, default: '' },
    voidReason: { type: String, default: '' },
    shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop' },
  },
  { timestamps: true }
);

export const Warranty = mongoose.models.Warranty || mongoose.model('Warranty', WarrantySchema);
