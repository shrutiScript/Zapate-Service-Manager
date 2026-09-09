import React, { useState } from 'react';
import {
  X,
  AlertTriangle,
  ShieldBan,
  Store,
  Lock,
} from 'lucide-react';
import { toast } from 'sonner';
import api from '../../../services/api.js';

export const BlockWorkshopModal = ({ shop, onClose, onSuccess }) => {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState('');

  if (!shop) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      setValidationError('Please specify a reason for blocking this workshop.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.post(`/shops/${shop._id}/block`, {
        reason: reason.trim(),
      });

      toast.success(`Workshop "${shop.name}" has been blocked and sessions revoked.`);
      if (onSuccess) onSuccess(res?.data || res);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to block workshop');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      onClick={onClose}
    >
      <div
        className="card"
        style={{
          maxWidth: '520px',
          width: '100%',
          padding: 0,
          background: '#ffffff',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            background: 'linear-gradient(135deg, #7f1d1d 0%, #991b1b 100%)',
            color: '#ffffff',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.2)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ShieldBan size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#ffffff', margin: 0 }}>
                Block Workshop Account
              </h3>
              <span style={{ fontSize: '12px', color: '#fca5a5' }}>
                Restrict platform access and invalidate sessions
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              color: '#fecaca',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Target Summary */}
          <div
            style={{
              padding: '12px 16px',
              borderRadius: '10px',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Store size={18} style={{ color: '#64748b' }} />
              <div>
                <strong style={{ fontSize: '13px', color: '#0f172a' }}>{shop.name}</strong>
                <div style={{ fontSize: '11px', color: '#64748b', fontFamily: 'JetBrains Mono' }}>
                  Code: {shop.code} • Owner: {shop.ownerName}
                </div>
              </div>
            </div>
            <span className="status-badge badge-green">Currently Active</span>
          </div>

          {/* Critical Warning Alert */}
          <div
            style={{
              padding: '14px 16px',
              borderRadius: '10px',
              background: '#fff1f2',
              border: '1px solid #fecdd3',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
            }}
          >
            <AlertTriangle size={20} style={{ color: '#e11d48', marginTop: '2px', flexShrink: 0 }} />
            <div style={{ fontSize: '12px', color: '#9f1239' }}>
              <strong style={{ display: 'block', marginBottom: '2px', fontWeight: '700' }}>
                Immediate System Enforcement:
              </strong>
              Blocking this workshop will <strong>instantly terminate all active sessions</strong> for all users and owners of this workshop.
              Any current API calls will be rejected with 401 Unauthorized, and future login attempts will be strictly denied (403 Forbidden).
            </div>
          </div>

          {/* Reason Field */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
              Reason for Blocking <span style={{ color: '#e11d48' }}>*</span>
            </label>
            <textarea
              className="input-control"
              rows={3}
              placeholder="e.g., Subscription payment default, violation of terms of service, fraudulent activity, requested by owner..."
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                setValidationError('');
              }}
              style={{
                width: '100%',
                resize: 'vertical',
                fontSize: '13px',
                borderColor: validationError ? '#ef4444' : undefined,
              }}
              required
            />
            {validationError && (
              <small style={{ color: '#ef4444', fontSize: '11px', marginTop: '4px', display: 'block' }}>
                {validationError}
              </small>
            )}
          </div>

          {/* Actions */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '10px',
              paddingTop: '8px',
              borderTop: '1px solid #f1f5f9',
            }}
          >
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn"
              disabled={isSubmitting}
              style={{
                background: '#dc2626',
                color: '#ffffff',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 2px 8px rgba(220, 38, 38, 0.3)',
              }}
            >
              <ShieldBan size={16} />
              {isSubmitting ? 'Revoking Access...' : 'Confirm & Block Workshop'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
