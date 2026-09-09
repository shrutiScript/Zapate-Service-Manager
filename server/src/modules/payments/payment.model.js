import mongoose from 'mongoose';

const PaymentSchema = new mongoose.Schema(
  {
    paymentReceiptNumber: { type: String, required: true, unique: true }, // e.g. "PAY-2026-00045"
    invoiceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice', required: true, index: true },
    invoiceNumber: { type: String, required: true, index: true },
    repairJobId: { type: mongoose.Schema.Types.ObjectId, ref: 'JobCard' },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
    customerName: { type: String, default: 'Walk-in Client' },
    customerMobile: { type: String, default: '' },
    amount: { type: Number, required: true },
    paymentMethod: { type: String, enum: ['Cash', 'UPI', 'Card', 'Bank Transfer', 'Other', 'Due'], default: 'Cash' },
    paymentDate: { type: Date, default: Date.now },
    notes: { type: String, default: '' },
    receivedBy: { type: String, default: 'Staff' },
    previousDue: { type: Number, default: 0 },
    remainingDue: { type: Number, default: 0 },
    shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true, index: true },
  },
  { timestamps: true }
);

const PaymentLedgerSchema = new mongoose.Schema(
  {
    transactionNumber: { type: String, required: true, unique: true }, // e.g. "TXN-9021" or "PAY-2026-00045"
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
    customerName: { type: String, required: true },
    customerMobile: { type: String, default: '' },
    invoiceNumber: { type: String },
    jobCardNumber: { type: String },
    amount: { type: Number, required: true },
    type: { type: String, enum: ['Credit', 'Debit'], default: 'Credit' },
    method: { type: String, enum: ['Cash', 'UPI', 'Card', 'Bank Transfer', 'Other', 'Due'], default: 'UPI' },
    paymentReceiptNumber: { type: String },
    referenceNumber: { type: String },
    balanceAfter: { type: Number, default: 0 },
    notes: { type: String },
    receivedBy: { type: String, default: 'Staff' },
    shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop' },
  },
  { timestamps: true }
);

export const Payment = mongoose.models.Payment || mongoose.model('Payment', PaymentSchema);
export const PaymentLedger = mongoose.models.PaymentLedger || mongoose.model('PaymentLedger', PaymentLedgerSchema);

