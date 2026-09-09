import mongoose from 'mongoose';

const PurchaseItemSchema = new mongoose.Schema({
  partId: { type: mongoose.Schema.Types.ObjectId, ref: 'SparePart' },
  name: { type: String, required: true },
  sku: { type: String },
  category: { type: String },
  quantity: { type: Number, required: true },
  purchasePrice: { type: Number, required: true },
  totalAmount: { type: Number, required: true },
});

const PurchaseSchema = new mongoose.Schema(
  {
    invoiceNumber: { type: String, required: true, unique: true }, // e.g. "PO-0089"
    supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier' },
    supplierName: { type: String, required: true },
    items: [PurchaseItemSchema],
    subtotal: { type: Number, default: 0 },
    taxAmount: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },
    paidAmount: { type: Number, default: 0 },
    pendingBalance: { type: Number, default: 0 },
    paymentStatus: { type: String, enum: ['Paid', 'Partial', 'Unpaid'], default: 'Paid' },
    shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop' },
  },
  { timestamps: true }
);

export const Purchase = mongoose.models.Purchase || mongoose.model('Purchase', PurchaseSchema);
