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
  },
  { timestamps: true }
);

export const Notification = mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);
