import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema(
  {
    userId: { type: String, unique: true, sparse: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    mobile: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ['SUPER_ADMIN', 'SHOP_OWNER'],
      default: 'SHOP_OWNER',
    },
    shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', default: null },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE', 'BLOCKED', 'SUSPENDED', 'PENDING', 'REJECTED'],
      default: 'ACTIVE',
    },
    sessionInvalidatedAt: { type: Date, default: null },
    onboardingCompleted: { type: Boolean, default: false },
    loginCount: { type: Number, default: 0 },
    lastLogin: { type: Date, default: null },
  },
  { timestamps: true }
);

export const User = mongoose.models.User || mongoose.model('User', UserSchema);
