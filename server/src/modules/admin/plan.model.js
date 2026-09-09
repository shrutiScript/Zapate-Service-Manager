import mongoose from 'mongoose';

const PlanSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    price: { type: Number, required: true },
    billingCycle: { type: String, enum: ['monthly', 'quarterly', 'yearly'], default: 'monthly' },
    allowedModules: [{ type: String }],
    maxUsers: { type: Number, default: 5 },
    maxTechnicians: { type: Number, default: 3 },
    maxBranches: { type: Number, default: 1 },
    description: { type: String },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Plan = mongoose.models.Plan || mongoose.model('Plan', PlanSchema);
