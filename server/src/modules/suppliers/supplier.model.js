import mongoose from 'mongoose';

const SupplierSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    contactPerson: { type: String },
    phone: { type: String, required: true },
    email: { type: String },
    gstin: { type: String },
    address: { type: String },
    city: { type: String, default: 'Bengaluru' },
    totalPurchased: { type: Number, default: 0 },
    outstandingBalance: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
    shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop' },
  },
  { timestamps: true }
);

export const Supplier = mongoose.models.Supplier || mongoose.model('Supplier', SupplierSchema);
