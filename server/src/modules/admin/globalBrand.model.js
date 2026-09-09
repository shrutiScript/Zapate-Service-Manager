import mongoose from 'mongoose';

const GlobalBrandSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    code: { type: String },
    logo: { type: String },
    modelsCount: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const GlobalBrand = mongoose.models.GlobalBrand || mongoose.model('GlobalBrand', GlobalBrandSchema);
