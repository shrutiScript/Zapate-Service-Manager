import mongoose from 'mongoose';

const RepairSchema = new mongoose.Schema(
  {
    number: { type: String, required: true, unique: true }, // e.g. "RF-2408"
    customer: {
      name: { type: String, required: true },
      mobile: { type: String },
      email: { type: String },
      id: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
    },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
    device: {
      brand: { type: String },
      model: { type: String, required: true },
      imei: { type: String },
      color: { type: String },
      conditionNotes: { type: String },
    },
    technician: {
      name: { type: String },
      id: { type: mongoose.Schema.Types.ObjectId, ref: 'Technician' },
    },
    issue: { type: String, required: true },
    diagnosisNotes: { type: String },
    status: {
      type: String,
      enum: [
        'Device Received',
        'Diagnosis Pending',
        'Diagnosis Completed',
        'Waiting Approval',
        'Waiting Parts',
        'Parts Ordered',
        'Repair in Progress',
        'Completed',
        'Quality Check',
        'Ready for Delivery',
        'Delivered',
        'Cancelled',
        'Returned Unrepaired',
      ],
      default: 'Device Received',
    },
    estimatedAmount: { type: Number, default: 0 },
    finalAmount: { type: Number, default: 0 },
    advancePayment: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    pendingAmount: { type: Number, default: 0 },
    parts: [
      {
        partId: { type: mongoose.Schema.Types.ObjectId, ref: 'SparePart' },
        name: { type: String },
        quantity: { type: Number, default: 1 },
        unitPrice: { type: Number, default: 0 },
        totalPrice: { type: Number, default: 0 },
      },
    ],
    history: [
      {
        status: { type: String },
        notes: { type: String },
        updatedBy: { type: String },
        timestamp: { type: Date, default: Date.now },
      },
    ],
    deviceAccess: {
      lockType: {
        type: String,
        enum: [
          'No Lock',
          'PIN',
          'Pattern Lock',
          'Password',
          'Biometric Only',
          'Customer Will Unlock',
        ],
        default: 'No Lock',
      },
      accessAvailable: { type: Boolean, default: true },
      hasCredential: { type: Boolean, default: false },
      encryptedCredential: { type: String, select: false },
      iv: { type: String, select: false },
      authTag: { type: String, select: false },
    },
    shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop' },
  },
  { timestamps: true }
);

export const JobCard = mongoose.models.JobCard || mongoose.model('JobCard', RepairSchema);
export const Repair = JobCard;
