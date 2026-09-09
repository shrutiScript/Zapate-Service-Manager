import mongoose from 'mongoose';

const DeviceSchema = new mongoose.Schema(
  {
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
    customerName: { type: String },
    type: { type: String, default: 'Smartphone' },
    brand: { type: String, required: true },
    model: { type: String, required: true },
    imei1: { type: String, required: true, trim: true },
    imei2: { type: String },
    serialNumber: { type: String },
    color: { type: String },
    condition: { type: String },
    checklist: {
      screenCondition: { type: String, default: 'Good' },
      bodyCondition: { type: String, default: 'Good' },
      cameraWorking: { type: Boolean, default: true },
      batteryHealth: { type: String, default: '85%' },
      waterDamage: { type: Boolean, default: false },
      chargingPortWorking: { type: Boolean, default: true },
    },
    images: [{ type: String }],
    shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop' },
  },
  { timestamps: true }
);

export const Device = mongoose.models.Device || mongoose.model('Device', DeviceSchema);
