import mongoose from 'mongoose';

const TestResultSchema = new mongoose.Schema({
  testId: { type: String, required: true },
  testName: { type: String },
  result: {
    type: String,
    enum: ['PASS', 'FAIL', 'OBSERVED_VALUE', 'INCONCLUSIVE', 'NOT_PERFORMED'],
    required: true,
  },
  observedValue: { type: String, default: '' },
  notes: { type: String, default: '' },
  technicianId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  technicianName: { type: String },
  engineVersion: { type: String, default: '2.0.0' },
  createdAt: { type: Date, default: Date.now },
});

const DiagnosticJourneyStepSchema = new mongoose.Schema({
  stepIndex: { type: Number, required: true },
  stepType: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String },
  testId: { type: String },
  testName: { type: String },
  testResult: { type: String },
  observedValue: { type: String },
  hypothesesRanking: { type: Array, default: [] },
  remainingUncertainties: { type: Array, default: [] },
  timestamp: { type: Date, default: Date.now },
});

const KnowledgeGapSchema = new mongoose.Schema({
  gapId: { type: String, required: true },
  gapType: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String },
  deviceBrand: { type: String },
  deviceModel: { type: String },
  symptomCodes: [{ type: String }],
  competingHypotheses: { type: Array, default: [] },
  missingOrConflictingEvidence: { type: String },
  suggestedExpertReview: { type: String },
  requiresAuthorization: { type: Boolean, default: true },
  status: {
    type: String,
    enum: ['PENDING_REVIEW', 'APPROVED', 'DISMISSED'],
    default: 'PENDING_REVIEW',
  },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewNotes: { type: String },
  createdAt: { type: Date, default: Date.now },
});

const DiagnosticSessionSchema = new mongoose.Schema(
  {
    shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true, index: true },
    repairJobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Repair', index: true },
    deviceBrand: { type: String, default: '' },
    deviceModel: { type: String, default: '' },
    symptoms: { type: String, default: '' },
    confirmedSymptoms: [{ type: String }],
    followUpAnswers: { type: mongoose.Schema.Types.Mixed, default: {} },
    actualTestResults: [TestResultSchema],
    diagnosticJourney: [DiagnosticJourneyStepSchema],
    knowledgeGaps: [KnowledgeGapSchema],
    latestDiagnosis: { type: mongoose.Schema.Types.Mixed },
    status: {
      type: String,
      enum: ['IN_TRIAGE', 'TESTS_IN_PROGRESS', 'CONFIRMED', 'KNOWLEDGE_GAP'],
      default: 'IN_TRIAGE',
    },
  },
  { timestamps: true }
);

// Ensure index for efficient querying and shop isolation
DiagnosticSessionSchema.index({ shopId: 1, repairJobId: 1 });
DiagnosticSessionSchema.index({ shopId: 1, createdAt: -1 });

export const DiagnosticSession =
  mongoose.models.DiagnosticSession || mongoose.model('DiagnosticSession', DiagnosticSessionSchema);
