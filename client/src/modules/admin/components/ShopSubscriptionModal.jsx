import React, { useState, useEffect } from 'react';
import {
  X,
  CreditCard,
  Calendar,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Store,
  User,
  Mail,
  Phone,
  Layers,
  History,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import api from '../../../services/api.js';
import { formatDateDMY, formatTime12h, calculateRemainingDays } from '../../../utils/formatters.js';

export const ShopSubscriptionModal = ({ shop, onClose, onSuccess }) => {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'extend' | 'change_plan' | 'history'
  const [details, setDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Extend Validity form state
  const [extendPreset, setExtendPreset] = useState('30');
  const [customExpiryDate, setCustomExpiryDate] = useState('');
  const [extendReason, setExtendReason] = useState('Super Admin authorized validity extension');
  const [isSubmittingExtend, setIsSubmittingExtend] = useState(false);

  // Change Plan / Manual Renew form state
  const [availablePlans, setAvailablePlans] = useState([]);
  const [newPlanId, setNewPlanId] = useState('');
  const [newBillingCycle, setNewBillingCycle] = useState('monthly');
  const [newPaymentStatus, setNewPaymentStatus] = useState('PAID');
  const [changeReason, setChangeReason] = useState('Administrative subscription plan update');
  const [isSubmittingChange, setIsSubmittingChange] = useState(false);

  useEffect(() => {
    if (shop?._id) {
      fetchSubscriptionData();
    }
  }, [shop?._id]);

  const fetchSubscriptionData = async () => {
    setIsLoading(true);
    try {
      const res = await api.get(`/shops/${shop._id}/subscription`);
      const data = res?.data || res;
      setDetails(data);

      if (data?.availablePlans?.length > 0) {
        setAvailablePlans(data.availablePlans);
        setNewPlanId(data.planId || data.availablePlans[0]._id);
        setNewBillingCycle(data.billingCycle || 'monthly');
      }
    } catch (err) {
      toast.error('Failed to load workshop subscription dossier.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExtendValidity = async (e) => {
    e.preventDefault();
    setIsSubmittingExtend(true);
    try {
      const payload = {
        reason: extendReason.trim() || 'Super Admin validity extension',
      };
      if (extendPreset === 'custom') {
        if (!customExpiryDate) {
          toast.error('Please specify a valid expiry date');
          setIsSubmittingExtend(false);
          return;
        }
        payload.newExpiryDate = customExpiryDate;
      } else {
        payload.days = parseInt(extendPreset, 10);
      }

      const res = await api.post(`/shops/${shop._id}/extend-subscription`, payload);
      toast.success(res?.message || 'Validity extended successfully!');
      fetchSubscriptionData();
      if (onSuccess) onSuccess();
      setActiveTab('overview');
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to extend subscription.');
    } finally {
      setIsSubmittingExtend(false);
    }
  };

  const handleChangePlan = async (e) => {
    e.preventDefault();
    setIsSubmittingChange(true);
    try {
      const payload = {
        planId: newPlanId,
        billingCycle: newBillingCycle,
        paymentStatus: newPaymentStatus,
        paymentMethod: 'Super Admin Override',
        notes: changeReason.trim() || 'Super Admin subscription update',
        renewedBy: 'SUPER_ADMIN',
      };

      const res = await api.post(`/shops/${shop._id}/renew`, payload);
      toast.success(res?.message || 'Subscription updated successfully!');
      fetchSubscriptionData();
      if (onSuccess) onSuccess();
      setActiveTab('overview');
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to update subscription.');
    } finally {
      setIsSubmittingChange(false);
    }
  };

  const getStatusBadge = (st) => {
    const s = (st || '').toUpperCase();
    if (s === 'ACTIVE') {
      return <span className="status-badge badge-green">ACTIVE</span>;
    }
    if (s === 'EXPIRING_SOON') {
      return <span className="status-badge badge-amber">EXPIRING SOON</span>;
    }
    if (s === 'EXPIRED') {
      return <span className="status-badge badge-red">EXPIRED</span>;
    }
    if (s === 'SUSPENDED') {
      return <span className="status-badge badge-red">SUSPENDED</span>;
    }
    return <span className="status-badge badge-blue">{s}</span>;
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: '780px',
          padding: 0,
          background: '#ffffff',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                background: 'rgba(37, 99, 235, 0.2)',
                border: '1px solid rgba(59, 130, 246, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#60a5fa',
              }}
            >
              <CreditCard size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#ffffff', margin: 0 }}>
                  {shop.name}
                </h3>
                <span
                  style={{
                    background: 'rgba(255, 255, 255, 0.15)',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontFamily: 'JetBrains Mono',
                    fontSize: '11px',
                    color: '#93c5fd',
                  }}
                >
                  {shop.code}
                </span>
              </div>
              <p style={{ fontSize: '12px', color: '#94a3b8', margin: '2px 0 0' }}>
                Workshop Subscription & Licensing Dossier
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '6px',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div
          style={{
            display: 'flex',
            background: '#f8fafc',
            borderBottom: '1px solid #e2e8f0',
            padding: '0 24px',
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            style={{
              padding: '12px 16px',
              border: 'none',
              background: 'none',
              borderBottom: activeTab === 'overview' ? '2px solid #2563eb' : '2px solid transparent',
              color: activeTab === 'overview' ? '#2563eb' : '#64748b',
              fontWeight: activeTab === 'overview' ? '700' : '600',
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            Subscription Overview
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('extend')}
            style={{
              padding: '12px 16px',
              border: 'none',
              background: 'none',
              borderBottom: activeTab === 'extend' ? '2px solid #2563eb' : '2px solid transparent',
              color: activeTab === 'extend' ? '#2563eb' : '#64748b',
              fontWeight: activeTab === 'extend' ? '700' : '600',
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            Extend Validity
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('change_plan')}
            style={{
              padding: '12px 16px',
              border: 'none',
              background: 'none',
              borderBottom: activeTab === 'change_plan' ? '2px solid #2563eb' : '2px solid transparent',
              color: activeTab === 'change_plan' ? '#2563eb' : '#64748b',
              fontWeight: activeTab === 'change_plan' ? '700' : '600',
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            Change Plan / Renew
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            style={{
              padding: '12px 16px',
              border: 'none',
              background: 'none',
              borderBottom: activeTab === 'history' ? '2px solid #2563eb' : '2px solid transparent',
              color: activeTab === 'history' ? '#2563eb' : '#64748b',
              fontWeight: activeTab === 'history' ? '700' : '600',
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>Renewal History</span>
            {details?.history?.length > 0 && (
              <span
                style={{
                  background: '#e2e8f0',
                  color: '#475569',
                  borderRadius: '10px',
                  padding: '1px 6px',
                  fontSize: '11px',
                }}
              >
                {details.history.length}
              </span>
            )}
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '48px', color: '#94a3b8' }}>
              <RefreshCw size={24} className="animate-spin" />
              <p style={{ marginTop: '8px', fontSize: '13px' }}>Loading subscription telemetry...</p>
            </div>
          ) : (
            <>
              {/* TAB 1: OVERVIEW */}
              {activeTab === 'overview' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {/* Status Banner */}
                  <div
                    style={{
                      padding: '16px 20px',
                      borderRadius: '12px',
                      background:
                        details.status === 'EXPIRED'
                          ? '#fef2f2'
                          : details.status === 'EXPIRING_SOON'
                          ? '#fffbeb'
                          : '#f0fdf4',
                      border:
                        details.status === 'EXPIRED'
                          ? '1px solid #fecaca'
                          : details.status === 'EXPIRING_SOON'
                          ? '1px solid #fde68a'
                          : '1px solid #bbf7d0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '12px',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {getStatusBadge(details.status)}
                        <strong style={{ fontSize: '15px', color: '#0f172a' }}>
                          {details.planName}
                        </strong>
                      </div>
                      <div style={{ fontSize: '12.5px', color: '#64748b', marginTop: '4px' }}>
                        Billing Cycle: <strong>{details.billingCycle?.toUpperCase()}</strong> • Payment:{' '}
                        <strong>{details.paymentStatus}</strong>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div
                        style={{
                          fontSize: '22px',
                          fontWeight: '800',
                          fontFamily: 'JetBrains Mono',
                          color:
                            details.status === 'EXPIRED'
                              ? '#dc2626'
                              : details.status === 'EXPIRING_SOON'
                              ? '#d97706'
                              : '#059669',
                        }}
                      >
                        {details.status === 'EXPIRED' ? 'Expired' : `${details.daysRemaining} Days Left`}
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>
                        Server time: {new Date(details.serverTime).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>

                  {/* 2-Column Info Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    {/* Column 1: Dates & Limits */}
                    <div
                      style={{
                        padding: '16px',
                        background: '#f8fafc',
                        borderRadius: '10px',
                        border: '1px solid #e2e8f0',
                      }}
                    >
                      <h4 style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', marginBottom: '12px' }}>
                        Validity Schedule
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div>
                          <div style={{ fontSize: '11px', color: '#94a3b8' }}>Plan Start Date</div>
                          <div style={{ fontSize: '13.5px', fontWeight: '700', color: '#0f172a', fontFamily: 'JetBrains Mono, monospace' }}>
                            {formatDateDMY(details.startDate)}
                          </div>
                          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                            Start Time: {formatTime12h(details.startDate)}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: '11px', color: details.status === 'EXPIRED' ? '#dc2626' : '#94a3b8', fontWeight: '600' }}>
                            Plan Expiry Date & Expiry Time
                          </div>
                          <div style={{ fontSize: '13.5px', fontWeight: '700', color: details.status === 'EXPIRED' ? '#dc2626' : '#2563eb', fontFamily: 'JetBrains Mono, monospace' }}>
                            {formatDateDMY(details.expiresAt)}
                          </div>
                          <div style={{ fontSize: '11px', color: details.status === 'EXPIRED' ? '#dc2626' : '#64748b', marginTop: '2px', fontWeight: details.status === 'EXPIRED' ? '700' : '500' }}>
                            Expiry Time: {formatTime12h(details.expiresAt)}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: '11px', color: '#94a3b8' }}>Staff & Tech Quotas</div>
                          <div style={{ fontSize: '12.5px', color: '#334155' }}>
                            Staff Limit: <strong>{details.planDetails?.limitUsers === -1 ? 'Unlimited' : (details.planDetails?.limitUsers ?? '—')}</strong> •{' '}
                            Tech Seats: <strong>{details.planDetails?.limitTechs === -1 ? 'Unlimited' : (details.planDetails?.limitTechs ?? '—')}</strong>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Column 2: Owner & Workshop Details */}
                    <div
                      style={{
                        padding: '16px',
                        background: '#f8fafc',
                        borderRadius: '10px',
                        border: '1px solid #e2e8f0',
                      }}
                    >
                      <h4 style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', marginBottom: '12px' }}>
                        Owner & Contact Dossier
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div>
                          <div style={{ fontSize: '11px', color: '#94a3b8' }}>Owner Name</div>
                          <div style={{ fontSize: '13px', fontWeight: '600', color: '#0f172a' }}>
                            {details.ownerName}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: '11px', color: '#94a3b8' }}>Owner Email</div>
                          <div style={{ fontSize: '13px', color: '#334155', fontFamily: 'JetBrains Mono' }}>
                            {details.ownerEmail}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: '11px', color: '#94a3b8' }}>Contact Number</div>
                          <div style={{ fontSize: '13px', color: '#334155' }}>
                            {details.contactNumber || details.ownerMobile}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Shortcuts */}
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => setActiveTab('extend')}
                      style={{ flex: 1 }}
                    >
                      <Clock size={15} /> Extend Validity Period
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setActiveTab('change_plan')}
                      style={{ flex: 1 }}
                    >
                      <Layers size={15} /> Change Plan / Renew
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 2: EXTEND VALIDITY */}
              {activeTab === 'extend' && (
                <form onSubmit={handleExtendValidity} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ fontSize: '13px', color: '#64748b' }}>
                    Grant immediate validity extension for <strong>{shop.name}</strong>. This action is recorded in the platform security audit trail.
                  </div>

                  {/* Preset Options */}
                  <div>
                    <label className="form-label">Extension Duration</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                      {[
                        { label: '+7 Days', value: '7' },
                        { label: '+30 Days (1 Mo)', value: '30' },
                        { label: '+90 Days (Quarter)', value: '90' },
                        { label: '+365 Days (1 Yr)', value: '365' },
                      ].map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setExtendPreset(opt.value)}
                          style={{
                            padding: '12px 8px',
                            borderRadius: '8px',
                            border: extendPreset === opt.value ? '2px solid #2563eb' : '1px solid #cbd5e1',
                            background: extendPreset === opt.value ? '#eff6ff' : '#ffffff',
                            color: extendPreset === opt.value ? '#1d4ed8' : '#334155',
                            fontWeight: '700',
                            fontSize: '12.5px',
                            cursor: 'pointer',
                          }}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Custom Expiry Date */}
                  <div>
                    <button
                      type="button"
                      onClick={() => setExtendPreset('custom')}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: extendPreset === 'custom' ? '#2563eb' : '#64748b',
                        fontWeight: '700',
                        fontSize: '12.5px',
                        cursor: 'pointer',
                        padding: 0,
                        marginBottom: '6px',
                      }}
                    >
                      {extendPreset === 'custom' ? '● Custom Expiry Date' : '○ Or specify custom exact expiry date'}
                    </button>
                    {extendPreset === 'custom' && (
                      <input
                        type="datetime-local"
                        className="input-control"
                        value={customExpiryDate}
                        onChange={(e) => setCustomExpiryDate(e.target.value)}
                        style={{ marginTop: '6px' }}
                      />
                    )}
                  </div>

                  {/* Audit Reason */}
                  <div>
                    <label className="form-label">Audit Log Reason (Required)</label>
                    <input
                      type="text"
                      className="input-control"
                      value={extendReason}
                      onChange={(e) => setExtendReason(e.target.value)}
                      placeholder="e.g. Offline payment verified via NEFT / Promotional extension"
                      required
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setActiveTab('overview')}
                      style={{ flex: 1 }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={isSubmittingExtend}
                      style={{ flex: 1 }}
                    >
                      {isSubmittingExtend ? (
                        <>
                          <RefreshCw size={15} className="animate-spin" /> Extending...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 size={15} /> Confirm Validity Extension
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}

              {/* TAB 3: CHANGE PLAN / RENEW */}
              {activeTab === 'change_plan' && (
                <form onSubmit={handleChangePlan} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ fontSize: '13px', color: '#64748b' }}>
                    Switch workshop subscription tier or manually execute renewal for <strong>{shop.name}</strong>.
                  </div>

                  {/* Plan Picker */}
                  <div>
                    <label className="form-label">Subscription Tier</label>
                    <select
                      className="select-control"
                      value={newPlanId}
                      onChange={(e) => setNewPlanId(e.target.value)}
                    >
                      {availablePlans.map((p) => (
                        <option key={p._id} value={p._id}>
                          {p.name} — ₹{p.price}/mo ({p.limitUsers === -1 ? 'Unlimited' : p.limitUsers} Staff Users)
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Billing Cycle & Payment Status */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label className="form-label">Billing Cycle</label>
                      <select
                        className="select-control"
                        value={newBillingCycle}
                        onChange={(e) => setNewBillingCycle(e.target.value)}
                      >
                        <option value="monthly">Monthly (30 Days)</option>
                        <option value="quarterly">Quarterly (90 Days)</option>
                        <option value="yearly">Yearly (365 Days)</option>
                      </select>
                    </div>
                    <div>
                      <label className="form-label">Payment Status</label>
                      <select
                        className="select-control"
                        value={newPaymentStatus}
                        onChange={(e) => setNewPaymentStatus(e.target.value)}
                      >
                        <option value="PAID">PAID (Access Restored)</option>
                        <option value="PENDING">PENDING</option>
                      </select>
                    </div>
                  </div>

                  {/* Reason */}
                  <div>
                    <label className="form-label">Audit Log Reason</label>
                    <input
                      type="text"
                      className="input-control"
                      value={changeReason}
                      onChange={(e) => setChangeReason(e.target.value)}
                      placeholder="e.g. Upgraded to Professional Tier as per request"
                      required
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setActiveTab('overview')}
                      style={{ flex: 1 }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={isSubmittingChange}
                      style={{ flex: 1 }}
                    >
                      {isSubmittingChange ? (
                        <>
                          <RefreshCw size={15} className="animate-spin" /> Updating...
                        </>
                      ) : (
                        <>
                          <ShieldCheck size={15} /> Apply Plan & Restore Access
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}

              {/* TAB 4: RENEWAL HISTORY */}
              {activeTab === 'history' && (
                <div>
                  <div style={{ marginBottom: '14px', fontSize: '13px', color: '#64748b' }}>
                    Complete audit trail of all subscription renewals, validity extensions, and plan transitions.
                  </div>

                  {details.history?.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '36px', color: '#94a3b8' }}>
                      No renewal events recorded yet.
                    </div>
                  ) : (
                    <div className="table-container" style={{ border: '1px solid #e2e8f0', borderRadius: '10px' }}>
                      <table className="pro-table">
                        <thead>
                          <tr>
                            <th>Renewed On</th>
                            <th>Plan & Cycle</th>
                            <th>Amount</th>
                            <th>Validity Period</th>
                            <th>Action Actor</th>
                            <th>Notes</th>
                          </tr>
                        </thead>
                        <tbody>
                          {details.history.map((h, i) => (
                            <tr key={h._id || i}>
                              <td>
                                <div style={{ fontSize: '12px', fontWeight: '600', color: '#0f172a', fontFamily: 'JetBrains Mono, monospace' }}>
                                  {formatDateDMY(h.renewedAt || h.startDate)}
                                </div>
                                <div style={{ fontSize: '10.5px', color: '#94a3b8' }}>
                                  {formatTime12h(h.renewedAt || h.startDate)}
                                </div>
                              </td>
                              <td>
                                <strong style={{ color: '#2563eb', fontSize: '12.5px' }}>{h.planName}</strong>
                                <span style={{ display: 'block', fontSize: '11px', color: '#64748b' }}>
                                  {h.billingCycle}
                                </span>
                              </td>
                              <td>
                                <span style={{ fontFamily: 'JetBrains Mono', fontSize: '12px', fontWeight: '700', color: '#0f172a' }}>
                                  ₹{(h.amount || 0).toLocaleString('en-IN')}
                                </span>
                              </td>
                              <td>
                                <div style={{ fontSize: '11px', color: '#334155', fontFamily: 'JetBrains Mono, monospace' }}>
                                  {formatDateDMY(h.startDate)} – {formatDateDMY(h.expiresAt)}
                                </div>
                              </td>
                              <td>
                                <span
                                  className={`status-badge ${h.renewedBy === 'SUPER_ADMIN' ? 'badge-amber' : 'badge-blue'}`}
                                  style={{ fontSize: '10px' }}
                                >
                                  {h.renewedBy}
                                </span>
                              </td>
                              <td>
                                <span style={{ fontSize: '11.5px', color: '#64748b' }}>
                                  {h.notes || '—'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
