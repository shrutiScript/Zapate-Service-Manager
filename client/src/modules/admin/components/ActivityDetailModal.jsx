import React from 'react';
import {
  X,
  ShieldAlert,
  User,
  Store,
  Clock,
  Calendar,
  Globe,
  Monitor,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileCode,
  ArrowRight,
  Info,
} from 'lucide-react';

export const ActivityDetailModal = ({ activity, onClose }) => {
  if (!activity) return null;

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'SUCCESS':
        return (
          <span className="status-badge badge-green" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <CheckCircle2 size={12} /> SUCCESS
          </span>
        );
      case 'FAILED':
        return (
          <span className="status-badge badge-red" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <XCircle size={12} /> FAILED
          </span>
        );
      case 'BLOCKED':
        return (
          <span className="status-badge badge-amber" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <AlertTriangle size={12} /> BLOCKED
          </span>
        );
      default:
        return <span className="status-badge badge-blue">{status || 'INFO'}</span>;
    }
  };

  const renderValue = (val) => {
    if (val === null || val === undefined) return <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>null</span>;
    if (typeof val === 'boolean') return <code>{val ? 'true' : 'false'}</code>;
    if (typeof val === 'object') return <pre style={{ margin: 0, fontSize: '11px', whiteSpace: 'pre-wrap' }}>{JSON.stringify(val, null, 2)}</pre>;
    return String(val);
  };

  const hasDiffs = activity.changedFields && activity.changedFields.length > 0;
  const prevData = activity.previousData || {};
  const nextData = activity.newData || {};

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
          maxWidth: '720px',
          width: '100%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
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
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            color: '#ffffff',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                background: 'rgba(245, 158, 11, 0.2)',
                color: '#fbbf24',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ShieldAlert size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#ffffff', margin: 0 }}>
                  {activity.action?.replace(/_/g, ' ')}
                </h3>
                {getStatusBadge(activity.status)}
              </div>
              <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                Category: <strong style={{ color: '#e2e8f0' }}>{activity.category}</strong> • ID: <span style={{ fontFamily: 'JetBrains Mono' }}>{activity._id}</span>
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              color: '#cbd5e1',
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

        {/* Scrollable Content Body */}
        <div style={{ padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Description banner */}
          <div
            style={{
              padding: '12px 16px',
              borderRadius: '8px',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
            }}
          >
            <Info size={18} style={{ color: '#2563eb', marginTop: '2px', flexShrink: 0 }} />
            <div>
              <strong style={{ fontSize: '13px', color: '#0f172a' }}>Action Summary</strong>
              <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#475569' }}>
                {activity.description || 'System recorded administrative event.'}
              </p>
            </div>
          </div>

          {/* Reason Callout if exists */}
          {activity.reason && (
            <div
              style={{
                padding: '12px 16px',
                borderRadius: '8px',
                background: '#fffbeb',
                border: '1px solid #fde68a',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
              }}
            >
              <AlertTriangle size={18} style={{ color: '#d97706', marginTop: '2px', flexShrink: 0 }} />
              <div>
                <strong style={{ fontSize: '13px', color: '#92400e' }}>Specified Action Reason</strong>
                <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#b45309', fontWeight: '500' }}>
                  {activity.reason}
                </p>
              </div>
            </div>
          )}

          {/* Actor & Target 2-Column Section */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {/* Actor Card */}
            <div
              style={{
                padding: '16px',
                borderRadius: '10px',
                border: '1px solid #e2e8f0',
                background: '#ffffff',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px', color: '#2563eb', fontWeight: '700', fontSize: '13px' }}>
                <User size={15} />
                <span>Actor (Performed By)</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px' }}>
                <div>
                  <span style={{ color: '#64748b' }}>Name:</span>{' '}
                  <strong style={{ color: '#0f172a' }}>{activity.actor?.name || 'System Auto'}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b' }}>Email:</span>{' '}
                  <span style={{ fontFamily: 'JetBrains Mono', color: '#334155' }}>{activity.actor?.email || '—'}</span>
                </div>
                <div>
                  <span style={{ color: '#64748b' }}>Role:</span>{' '}
                  <span className="status-badge badge-amber" style={{ fontSize: '10px', padding: '1px 6px' }}>
                    {activity.actor?.role || 'SYSTEM'}
                  </span>
                </div>
              </div>
            </div>

            {/* Target Card */}
            <div
              style={{
                padding: '16px',
                borderRadius: '10px',
                border: '1px solid #e2e8f0',
                background: '#ffffff',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px', color: '#059669', fontWeight: '700', fontSize: '13px' }}>
                <Store size={15} />
                <span>Target Entity</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px' }}>
                <div>
                  <span style={{ color: '#64748b' }}>Entity Type:</span>{' '}
                  <strong style={{ color: '#0f172a' }}>{activity.targetType || 'System'}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b' }}>Target Name:</span>{' '}
                  <strong style={{ color: '#0f172a' }}>{activity.targetName || '—'}</strong>
                </div>
                {activity.targetId && (
                  <div>
                    <span style={{ color: '#64748b' }}>Target ID:</span>{' '}
                    <span style={{ fontFamily: 'JetBrains Mono', color: '#334155' }}>{activity.targetId}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Technical Metadata Section */}
          <div
            style={{
              padding: '14px 16px',
              borderRadius: '10px',
              border: '1px solid #e2e8f0',
              background: '#f8fafc',
              fontSize: '12px',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar size={14} style={{ color: '#64748b' }} />
              <div>
                <span style={{ color: '#64748b' }}>Logged At:</span>{' '}
                <strong style={{ color: '#0f172a' }}>{formatDate(activity.createdAt)}</strong>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Globe size={14} style={{ color: '#64748b' }} />
              <div>
                <span style={{ color: '#64748b' }}>IP Address:</span>{' '}
                <span style={{ fontFamily: 'JetBrains Mono', fontWeight: '600', color: '#334155' }}>
                  {activity.ipAddress || '127.0.0.1'}
                </span>
              </div>
            </div>
            <div style={{ gridColumn: 'span 2', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <Monitor size={14} style={{ color: '#64748b', marginTop: '2px', flexShrink: 0 }} />
              <div>
                <span style={{ color: '#64748b' }}>User Agent:</span>{' '}
                <span style={{ color: '#475569', fontSize: '11px', wordBreak: 'break-all' }}>
                  {activity.userAgent || 'Internal API Client'}
                </span>
              </div>
            </div>
          </div>

          {/* Changed Data Comparison (Before vs After Diff) */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px', color: '#0f172a', fontWeight: '800', fontSize: '14px' }}>
              <FileCode size={16} style={{ color: '#f59e0b' }} />
              <span>Data Audit Trail & Diffs</span>
              {hasDiffs && (
                <span className="status-badge badge-blue" style={{ fontSize: '10px', marginLeft: 'auto' }}>
                  {activity.changedFields.length} Modified Field(s)
                </span>
              )}
            </div>

            {hasDiffs ? (
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                      <th style={{ padding: '10px 14px', color: '#475569', fontWeight: '700', width: '25%' }}>Modified Field</th>
                      <th style={{ padding: '10px 14px', color: '#ef4444', fontWeight: '700', width: '37.5%' }}>Previous State (Before)</th>
                      <th style={{ padding: '10px 14px', color: '#10b981', fontWeight: '700', width: '37.5%' }}>New State (After)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activity.changedFields.map((field) => (
                      <tr key={field} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '10px 14px', fontWeight: '600', color: '#0f172a', background: '#fafafa' }}>
                          <code>{field}</code>
                        </td>
                        <td style={{ padding: '10px 14px', background: '#fef2f2', color: '#991b1b', wordBreak: 'break-all' }}>
                          {renderValue(prevData[field])}
                        </td>
                        <td style={{ padding: '10px 14px', background: '#f0fdf4', color: '#166534', wordBreak: 'break-all' }}>
                          {renderValue(nextData[field])}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : activity.newData ? (
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '14px',
                  maxHeight: '200px',
                  overflowY: 'auto',
                }}
              >
                <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '6px', fontWeight: '600' }}>
                  Snapshot Payload:
                </div>
                <pre style={{ margin: 0, fontSize: '11px', fontFamily: 'JetBrains Mono', color: '#334155' }}>
                  {JSON.stringify(activity.newData, null, 2)}
                </pre>
              </div>
            ) : (
              <div
                style={{
                  padding: '24px',
                  textAlign: 'center',
                  background: '#f8fafc',
                  borderRadius: '10px',
                  border: '1px dashed #cbd5e1',
                  color: '#94a3b8',
                  fontSize: '12px',
                }}
              >
                No field diffs recorded for this action.
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '14px 24px',
            borderTop: '1px solid #e2e8f0',
            background: '#f8fafc',
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <button className="btn btn-secondary" onClick={onClose} type="button">
            Close Detail View
          </button>
        </div>
      </div>
    </div>
  );
};
