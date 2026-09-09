import mongoose from 'mongoose';

const InvoiceItemSchema = new mongoose.Schema({
  partId: { type: mongoose.Schema.Types.ObjectId, ref: 'SparePart' },
  name: { type: String, required: true },
  sku: { type: String, default: '' },
  category: { type: String, default: 'General' },
  brand: { type: String, default: '' },
  model: { type: String, default: '' },
  problem: { type: String, default: '' },
  price: { type: Number, required: true, default: 0 },
  quantity: { type: Number, default: 1 },
  taxPercent: { type: Number, default: 0 },
  total: { type: Number, required: true, default: 0 },
});

const CustomFieldSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  value: { type: String, required: true, trim: true },
});

const InvoiceSchema = new mongoose.Schema(
  {
    number: { type: String, required: true, unique: true }, // e.g. "INV-000072"
    orderId: { type: String, required: true }, // e.g. "ORD100072"
    
    // Invoice Classification & Relationships
    invoiceType: { type: String, enum: ['REPAIR', 'QUICK_SALE'], default: 'QUICK_SALE', index: true },
    repairJobId: { type: mongoose.Schema.Types.ObjectId, ref: 'JobCard' },

    // Customer Details
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
    customerName: { type: String, required: true, default: 'Walk-in Client' },
    customerMobile: { type: String, default: '' },
    customerEmail: { type: String, default: '' },
    customerAddress: { type: String, default: '' },

    // Device Information
    deviceBrand: { type: String, default: '' },
    deviceModel: { type: String, default: '' },
    deviceImei: { type: String, default: '' },
    deviceSerialNumber: { type: String, default: '' },

    // Repair Information
    reportedProblem: { type: String, default: '' },
    serviceCharge: { type: Number, default: 0 },
    additionalCharges: [
      {
        name: { type: String, default: '' },
        amount: { type: Number, default: 0 },
      },
    ],

    // Itemized lines
    items: [InvoiceItemSchema],

    // Custom Fields & Notes
    notes: { type: String, default: '' },
    customFields: [CustomFieldSchema],

    // Financial Breakdown
    subtotal: { type: Number, default: 0 },
    taxAmount: { type: Number, default: 0 },
    taxPercent: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    total: { type: Number, required: true },
    paidAmount: { type: Number, default: 0 },
    dueAmount: { type: Number, default: 0 },
    paymentMethod: { type: String, enum: ['Cash', 'UPI', 'Card', 'Bank Transfer', 'Other', 'Due', 'Split'], default: 'UPI' },
    status: { type: String, enum: ['PAID', 'PARTIALLY PAID', 'UNPAID', 'CANCELLED', 'Paid', 'Pending', 'Unpaid', 'Partial', 'Cancelled'], default: 'PAID' },


    // Snapshot of Shop Information at time of invoice creation
    shopSnapshot: {
      name: { type: String, default: '' },
      ownerName: { type: String, default: '' },
      ownerMobile: { type: String, default: '' },
      ownerEmail: { type: String, default: '' },
      businessEmail: { type: String, default: '' },
      shopContactNumber: { type: String, default: '' },
      logo: { type: String, default: '' },
      address: { type: String, default: '' },
      city: { type: String, default: '' },
      state: { type: String, default: '' },
      pincode: { type: String, default: '' },
      gstNumber: { type: String, default: '' },
      businessType: { type: String, default: 'Mobile Repair Workshop' },
      termsAndConditions: { type: String, default: '' },
    },

    shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true, index: true },
  },
  { timestamps: true }
);

export const Invoice = mongoose.models.Invoice || mongoose.model('Invoice', InvoiceSchema);
