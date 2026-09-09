import mongoose from 'mongoose';

const GlobalCategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    code: { type: String },
    type: { type: String, enum: ['SparePart', 'RepairService', 'DeviceType'], default: 'SparePart' },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const GlobalCategory = mongoose.models.GlobalCategory || mongoose.model('GlobalCategory', GlobalCategorySchema);
