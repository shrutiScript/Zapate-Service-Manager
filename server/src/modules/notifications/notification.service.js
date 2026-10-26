import { Notification } from './notification.model.js';

export class NotificationService {
  async getAll(shopId = null) {
    const filter = shopId ? { shopId } : {};
    return Notification.find(filter).sort({ sentAt: -1, createdAt: -1 });
  }

  async send(data, shopId = null) {
    const channel = data.channel || (['WhatsApp', 'SMS', 'Email', 'In-App'].includes(data.type) ? data.type : 'WhatsApp');
    const recipientContact = data.recipientContact || data.recipientPhone || data.recipient || data.phone || data.mobile || '';
    const recipientName = data.recipientName || data.name || data.recipient || 'Customer';
    const type = data.type || (channel === 'SMS' ? 'SMS Notification' : 'WhatsApp Notification');

    return Notification.create({
      ...data,
      recipientName,
      recipientContact,
      channel,
      type,
      status: 'Delivered',
      sentAt: new Date(),
      shopId,
    });
  }

  async delete(id, shopId = null) {
    const filter = { _id: id };
    if (shopId) filter.shopId = shopId;
    return Notification.findOneAndDelete(filter);
  }

  async markAsRead(id, shopId = null) {
    const filter = { _id: id };
    if (shopId) filter.shopId = shopId;
    return Notification.findOneAndUpdate(filter, { status: 'Read' }, { new: true });
  }

  async markAllAsRead(shopId = null) {
    const filter = shopId ? { shopId } : {};
    return Notification.updateMany(filter, { status: 'Read' });
  }

  async getTemplates() {
    return [
      { id: '1', title: 'Job Intake Check-in', template: 'Hello {customerName}, we have received your {deviceModel} (Job {jobCardNumber}). Diagnosis is underway.' },
      { id: '2', title: 'Estimate Approval Request', template: 'Hello {customerName}, repair diagnosis for {deviceModel} is complete. Estimated cost is ₹{amount}. Reply YES to approve.' },
      { id: '3', title: 'Job Ready For Pickup', template: 'Dear {customerName}, your {deviceModel} (Job {jobCardNumber}) is ready for delivery! Outstanding balance: ₹{dueAmount}.' },
      { id: '4', title: 'Payment Receipt', template: 'Thank you {customerName}! We have received payment of ₹{amount} against Invoice {invoiceNumber}.' },
      { id: '5', title: 'Low Stock Alert', template: 'Alert: Item {productName} is below safety threshold ({quantity} remaining).' },
    ];
  }
}
