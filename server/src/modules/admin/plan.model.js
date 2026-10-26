import mongoose from 'mongoose';

const PlanSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    yearlyPrice: { type: Number, default: 0, min: 0 },
    billingCycle: { type: String, default: 'monthly' },
    durationDays: { type: Number, default: null }, // Support custom 1, 2, 3, 4, 5, 6, 7 days or any duration
    durationHours: { type: Number, default: null }, // Support short-duration subscriptions (< 24h)
    allowedModules: [{ type: String }],
    maxUsers: { type: Number, default: 2 }, // legacy / alias
    maxTechnicians: { type: Number, default: 2 }, // legacy / alias
    limitUsers: { type: Number, default: 2 }, // -1 = Unlimited
    limitTechs: { type: Number, default: 2 }, // -1 = Unlimited
    maxBranches: { type: Number, default: 1 },
    repairTicketLimit: { type: Number, default: -1 }, // -1 = Unlimited
    supportLevel: { type: String, default: 'Standard Support' },
    features: [{ type: String }],
    badge: { type: String, default: '' },
    description: { type: String, default: '' },
    isPopular: { type: Boolean, default: false },
    active: { type: Boolean, default: true },
    isArchived: { type: Boolean, default: false },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Synchronize legacy maxUsers / maxTechnicians with limitUsers / limitTechs
PlanSchema.pre('save', function () {
  if (this.limitUsers !== undefined) {
    this.maxUsers = this.limitUsers;
  } else if (this.maxUsers !== undefined) {
    this.limitUsers = this.maxUsers;
  }

  if (this.limitTechs !== undefined) {
    this.maxTechnicians = this.limitTechs;
  } else if (this.maxTechnicians !== undefined) {
    this.limitTechs = this.maxTechnicians;
  }
});

export const Plan = mongoose.models.Plan || mongoose.model('Plan', PlanSchema);

