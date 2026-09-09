import mongoose from 'mongoose';

const AiFeedbackSchema = new mongoose.Schema(
  {
    shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true, index: true },
    repairJobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Repair', index: true },
    deviceBrand: { type: String },
    deviceModel: { type: String, required: true },
    symptoms: { type: String, required: true },
    predictedHypotheses: [
      {
        id: { type: String },
        name: { type: String },
        diagnosticConfidenceScore: { type: Number },
      },
    ],
    confirmedFault: { type: String }, // Actual fault confirmed by technician
    repairPerformed: { type: String }, // Actual repair steps taken
    partsUsed: [{ type: String }],
    wasAiUseful: { type: Boolean },
    technicianNotes: { type: String },
    engineVersion: { type: String, default: '1.0.0' },
  },
  { timestamps: true }
);

export const AiFeedback = mongoose.models.AiFeedback || mongoose.model('AiFeedback', AiFeedbackSchema);
