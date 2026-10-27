import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema(
  {
    recipientName: { type: String, required: true },
    recipientContact: { type: String, default: '' },
    channel: { type: String, enum: ['WhatsApp', 'SMS', 'Email', 'In-App'], default: 'WhatsApp' },
    type: { type: String, default: 'Repair In Progress' },
    title: { type: String, required: true },
    message: { type: String, required: true },
    jobCardNumber: { type: String },
    invoiceNumber: { type: String },
    status: { type: String, enum: ['Sent', 'Delivered', 'Failed', 'Queued', 'Read'], default: 'Delivered' },
    sentAt: { type: Date, default: Date.now },
    shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop' },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    postId: { type: String, default: '' },
    commentId: { type: String, default: '' },
    link: { type: String, default: '' },
    actionType: { type: String, default: '' },
    actorName: { type: String, default: '' },
    actorShopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop' },
    actorUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

export const Notification = mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);
