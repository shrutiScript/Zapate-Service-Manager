import mongoose from 'mongoose';

const UsedMobileSchema = new mongoose.Schema(
  {
    brand: { type: String, required: true },
    model: { type: String, required: true },
    storage: { type: String, default: '128GB' },
    color: { type: String },
    imei1: { type: String, required: true, unique: true },
    imei2: { type: String },
    batteryHealth: { type: String, default: '100%' },
    condition: {
      type: String,
      enum: [
        'Grade A+ (Flawless)',
        'Grade A (Minor wear)',
        'Grade B (Good)',
        'Grade C (Fair)',
        'Under Repair',
      ],
      default: 'Grade A (Minor wear)',
    },
    purchasePrice: { type: Number, required: true },
    repairCost: { type: Number, default: 0 },
    sellingPrice: { type: Number, required: true },
    expectedMargin: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['In Stock', 'Under Repair', 'Reserved', 'Sold'],
      default: 'In Stock',
    },
    sellerName: { type: String },
    sellerPhone: { type: String },
    buyerName: { type: String },
    buyerPhone: { type: String },
    soldDate: { type: Date },
    notes: { type: String },
    shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop' },
  },
  { timestamps: true }
);

export const UsedMobile = mongoose.models.UsedMobile || mongoose.model('UsedMobile', UsedMobileSchema);
