import mongoose from 'mongoose';

const SparePartSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    category: { type: String, required: true },
    brand: { type: String, default: 'Universal' },
    compatibleModel: { type: String, default: 'Universal' },
    sku: { type: String, required: true, unique: true },
    barcode: { type: String },
    purchasePrice: { type: Number, required: true, default: 0 },
    sellingPrice: { type: Number, required: true, default: 0 },
    quantity: { type: Number, default: 0 },
    minimumQuantity: { type: Number, default: 3 },
    supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier' },
    locationRack: { type: String, default: 'Shelf A-01' },
    status: { type: String, enum: ['In Stock', 'Low Stock', 'Out of Stock'], default: 'In Stock' },
    shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop' },
  },
  { timestamps: true }
);

export const SparePart = mongoose.models.SparePart || mongoose.model('SparePart', SparePartSchema);
export const Inventory = SparePart;
