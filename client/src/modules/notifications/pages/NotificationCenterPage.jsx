import React, { useState, useEffect } from 'react';
import { MainLayout } from '../../../components/layout/MainLayout.jsx';
import {
  Send,
  Bell,
  CheckCircle,
  MessageSquare,
  Smartphone,
  Zap,
  ArrowRight,
  Inbox,
  Trash2,
  AlertTriangle,
  Mail,
} from 'lucide-react';
import { toast } from 'sonner';
import api from '../../../services/api.js';

export const NotificationCenterPage = () => {
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [notificationToDelete, setNotificationToDelete] = useState(null);

  // Custom Dispatch form state
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [channel, setChannel] = useState('WhatsApp');
  const [customTitle, setCustomTitle] = useState('');
  const [customMsg, setCustomMsg] = useState('');

  const loadNotifications = () => {
    setIsLoading(true);
    api.get('/notifications')
      .then((res) => {
        if (Array.isArray(res)) {
          const mapped = res.map((n, i) => ({
            id: n._id || n.id || String(i + 1),
            customer: n.recipientName || n.recipient || 'Customer',
            mobile: n.recipientContact || n.recipientPhone || n.phone || '',
            type: n.channel || n.type || (n.channel === 'WHATSAPP' ? 'WhatsApp' : 'SMS'),
            title: n.title || n.subject || 'Automated Alert',
            msg: n.message || n.content || '',
            time: n.sentAt || n.createdAt ? new Date(n.sentAt || n.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'Recent',
          }));
          setLogs(mapped);
        } else {
          setLogs([]);
        }
      })
      .catch(() => {
        setLogs([]);
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleSendTrigger = async (type, title, msg) => {
    setIsSending(true);
    try {
      await api.post('/notifications/send', {
        type,
        channel: type === 'SMS' ? 'SMS' : 'WhatsApp',
        title,
        recipient: 'Active Client',
        recipientName: 'Active Client',
        recipientContact: 'Active Client',
        message: msg,
      });
      toast.success(`${type} template dispatched successfully!`);
      loadNotifications();
    } catch (err) {
      toast.error(err.message || 'Failed to dispatch alert');
    } finally {
      setIsSending(false);
    }
  };

  const handleSendCustomNotification = async (e) => {
    e.preventDefault();
    if (!recipientName.trim() || !customTitle.trim() || !customMsg.trim()) {
      toast.error('Recipient name, title, and message are required');
      return;
    }

    setIsSending(true);
    try {
      await api.post('/notifications/send', {
        channel,
        type: `${channel} Alert`,
        title: customTitle.trim(),
        recipient: recipientPhone.trim() || recipientName.trim(),
        recipientName: recipientName.trim(),
        recipientContact: recipientPhone.trim() || recipientName.trim(),
        recipientPhone: recipientPhone.trim(),
        message: customMsg.trim(),
      });
      toast.success(`${channel} message sent to ${recipientName}!`);
      setRecipientName('');
      setRecipientPhone('');
      setCustomTitle('');
      setCustomMsg('');
      loadNotifications();
    } catch (err) {
      toast.error(err.message || 'Failed to dispatch notification');
    } finally {
      setIsSending(false);
    }
  };

  const handleDeleteNotification = async () => {
    if (!notificationToDelete) return;
    try {
      await api.delete(`/notifications/${notificationToDelete.id}`);
      toast.success('Notification log removed!');
      setNotificationToDelete(null);
      loadNotifications();
    } catch (err) {
      toast.error(err.message || 'Failed to delete notification');
    }
  };

  return (
    <MainLayout title="Notification Hub" subtitle="Automated SMS & WhatsApp">
      <div className="page-header">
        <div className="page-header-info">
          <div className="page-badge-eyebrow">
            <span /> CUSTOMER OUTREACH
          </div>
          <h1>Notification & Messaging Center</h1>
          <p>Automated WhatsApp repair alerts, SMS milestone receipts, and custom customer broadcast dispatches.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '20px', alignItems: 'start' }}>
        {/* Outbox Activity Log */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Dispatch Log</span>
              <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>Sent Communications</h3>
            </div>
            <span className="status-badge badge-green">Gateway Active</span>
          </div>

          <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {logs.length === 0 && !isLoading ? (
              <div style={{ textAlign: 'center', padding: '48px 20px', color: '#94a3b8' }}>
                <Bell size={36} style={{ margin: '0 auto 12px', color: '#cbd5e1' }} />
                <h4 style={{ fontSize: '15px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                  No notifications dispatched yet
                </h4>
                <p style={{ fontSize: '13px', color: '#64748b', maxWidth: '360px', margin: '0 auto' }}>
                  Automated WhatsApp repair alerts and SMS milestone receipts will appear here as repair tickets progress.
                </p>
              </div>
            ) : (
              logs.map((log) => (
                <div
                  key={log.id}
                  style={{
                    padding: '14px',
                    background: '#f8fafc',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '14px',
                  }}
                >
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: 'var(--radius-md)',
                      background: log.type === 'WhatsApp' ? '#ecfdf5' : '#eff6ff',
                      color: log.type === 'WhatsApp' ? '#059669' : '#2563eb',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: '800',
                      fontSize: '11px',
                      flexShrink: 0,
                    }}
                  >
                    {log.type === 'WhatsApp' ? 'WA' : 'SMS'}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ fontSize: '13px', color: '#0f172a' }}>{log.customer}</strong>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '10px', color: '#94a3b8' }}>{log.time}</span>
                        <button
                          type="button"
                          onClick={() => setNotificationToDelete(log)}
                          style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#ef4444', padding: '2px' }}
                          title="Delete log"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                    <div style={{ fontSize: '11px', color: '#2563eb', fontWeight: '600', marginTop: '1px' }}>
                      {log.title} {log.mobile && `• ${log.mobile}`}
                    </div>
                    <p style={{ fontSize: '12px', color: '#475569', marginTop: '6px', lineHeight: 1.4 }}>
                      {log.msg}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Dispatch Options Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Custom Outreach Composer */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingBottom: '14px', borderBottom: '1px solid var(--border-color)' }}>
              <Send size={18} style={{ color: '#2563eb' }} />
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>Compose Message</h3>
                <p style={{ fontSize: '12px', color: '#64748b' }}>Direct dispatch via SMS or WhatsApp</p>
              </div>
            </div>

            <form onSubmit={handleSendCustomNotification} style={{ marginTop: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="form-group">
                  <label className="form-label">Client Name *</label>
                  <input
                    type="text"
                    className="input-control"
                    placeholder="e.g. Vikram Sethi"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Channel</label>
                  <select
                    className="select-control"
                    value={channel}
                    onChange={(e) => setChannel(e.target.value)}
                  >
                    <option value="WhatsApp">WhatsApp</option>
                    <option value="SMS">SMS Gateway</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Mobile Number</label>
                <input
                  type="tel"
                  className="input-control"
                  placeholder="9876543210"
                  value={recipientPhone}
                  onChange={(e) => setRecipientPhone(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Subject / Title *</label>
                <input
                  type="text"
                  className="input-control"
                  placeholder="e.g. Device Ready for Collection"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Message Body *</label>
                <textarea
                  className="input-control"
                  rows={2}
                  placeholder="Your iPhone 13 Pro display repair has passed QC and is ready for pickup."
                  value={customMsg}
                  onChange={(e) => setCustomMsg(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center' }}
                disabled={isSending}
              >
                {isSending ? 'Sending...' : `Send ${channel} Alert`} <Send size={14} />
              </button>
            </form>
          </div>

          {/* Quick Triggers */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingBottom: '14px', borderBottom: '1px solid var(--border-color)' }}>
              <Zap size={18} style={{ color: '#2563eb' }} />
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>Quick Templates</h3>
                <p style={{ fontSize: '12px', color: '#64748b' }}>Dispatch instant automated templates</p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '14px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ justifyContent: 'space-between', padding: '10px 14px' }}
                disabled={isSending}
                onClick={() => handleSendTrigger('WhatsApp', 'Intake Confirmation', 'Your handset job card has been created. Diagnosis in progress.')}
              >
                <span>WhatsApp: Intake Confirmation</span>
                <ArrowRight size={14} />
              </button>

              <button
                type="button"
                className="btn btn-secondary"
                style={{ justifyContent: 'space-between', padding: '10px 14px' }}
                disabled={isSending}
                onClick={() => handleSendTrigger('WhatsApp', 'Repair Ready for Delivery', 'QC tests completed successfully. Your device is ready for pickup at our workshop!')}
              >
                <span>WhatsApp: Device Ready</span>
                <ArrowRight size={14} />
              </button>

              <button
                type="button"
                className="btn btn-secondary"
                style={{ justifyContent: 'space-between', padding: '10px 14px' }}
                disabled={isSending}
                onClick={() => handleSendTrigger('SMS', 'Payment Invoice Receipt', 'Thank you for your payment. Your receipt has been settled in full.')}
              >
                <span>SMS: Invoice Paid Receipt</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Notification Modal */}
      {notificationToDelete && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '16px',
          }}
        >
          <div className="card" style={{ maxWidth: '400px', width: '100%', padding: '24px', textAlign: 'center' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: 'rgba(239, 68, 68, 0.15)',
                color: '#ef4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
              }}
            >
              <AlertTriangle size={24} />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>
              Delete Notification Log?
            </h3>
            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '20px', lineHeight: 1.5 }}>
              Are you sure you want to remove this dispatch record for <strong>{notificationToDelete.customer}</strong>?
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setNotificationToDelete(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                style={{ background: '#ef4444', borderColor: '#ef4444' }}
                onClick={handleDeleteNotification}
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
};
