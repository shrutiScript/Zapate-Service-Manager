import mongoose from 'mongoose';

const ActivityLogSchema = new mongoose.Schema(
  {
    // Action identifier (e.g. WORKSHOP_BLOCKED, WORKSHOP_CREATED, USER_UPDATED, PLAN_UPDATED)
    action: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    // Action Category
    category: {
      type: String,
      enum: [
        'Workshop',
        'User',
        'Subscription',
        'Brand',
        'Device Model',
        'Security',
        'Authentication',
        'Global Settings',
        'System',
      ],
      required: true,
      index: true,
    },
    // Target entity details
    targetType: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    targetId: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
      index: true,
    },
    targetName: {
      type: String,
      default: '—',
      trim: true,
      index: true,
    },

    // Audit State Diffs
    previousData: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    newData: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    changedFields: {
      type: [String],
      default: [],
    },

    // Administrative Actor
    performedBy: {
      type: String,
      required: true,
      default: 'Super Admin',
      trim: true,
      index: true,
    },
    performedById: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    // Operational Context
    reason: {
      type: String,
      default: null,
      trim: true,
    },
    status: {
      type: String,
      enum: ['SUCCESS', 'FAILED'],
      default: 'SUCCESS',
      index: true,
    },
    ipAddress: {
      type: String,
      default: '127.0.0.1',
    },
    userAgent: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for high performance administrative filtering & search
ActivityLogSchema.index({ createdAt: -1 });
ActivityLogSchema.index({ category: 1, createdAt: -1 });
ActivityLogSchema.index({ status: 1, createdAt: -1 });
ActivityLogSchema.index({ targetName: 'text', performedBy: 'text', reason: 'text', action: 'text' });

export const ActivityLog =
  mongoose.models.ActivityLog || mongoose.model('ActivityLog', ActivityLogSchema);
