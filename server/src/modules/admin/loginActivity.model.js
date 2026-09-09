import mongoose from 'mongoose';

const LoginActivitySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    userName: { type: String, required: true },
    email: { type: String, required: true },
    role: { type: String, required: true },
    shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', default: null },
    shopName: { type: String, default: null },
    loginAt: { type: Date, default: Date.now },
    ipAddress: { type: String, default: '127.0.0.1' },
    userAgent: { type: String, default: '' },
  },
  { timestamps: true }
);

export const LoginActivity =
  mongoose.models.LoginActivity || mongoose.model('LoginActivity', LoginActivitySchema);
