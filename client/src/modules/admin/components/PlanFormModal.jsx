import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Trash2,
  Sparkles,
  Check,
  Shield,
  Users,
  Wrench,
  AlertTriangle,
  FileText,
  Lock,
  Layers,
  Archive,
} from 'lucide-react';
import { toast } from 'sonner';
import api from '../../../services/api.js';

const PRESET_FEATURES = [
  'Dashboard & CRM',
  'Repair Tickets (Max 50/mo)',
  'Unlimited Repair Tickets',
  'POS Billing',
  'Parts Inventory Matrix',
  'Supplier Procurement POs',
  'SMS & WhatsApp Hub',
  'Standard Support',
  'Priority Support',
  'Multi-Branch Support',
  'Used Mobile Marketplace',
  'Automated Financial Ledger',
  'Custom Domain & Invoicing',
  'Dedicated Account Manager',
];

export const PlanFormModal = ({ isOpen, plan, onClose, onSuccess }) => {
  const isEditing = Boolean(plan && plan._id);

  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [yearlyPrice, setYearlyPrice] = useState('');
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [description, setDescription] = useState('');
  const [badge, setBadge] = useState('');
  const [supportLevel, setSupportLevel] = useState('Standard Support');

  // Limits
  const [isUnlimitedUsers, setIsUnlimitedUsers] = useState(false);
  const [limitUsers, setLimitUsers] = useState(2);

  const [isUnlimitedTechs, setIsUnlimitedTechs] = useState(false);
  const [limitTechs, setLimitTechs] = useState(2);

  const [isUnlimitedRepairs, setIsUnlimitedRepairs] = useState(true);
  const [repairTicketLimit, setRepairTicketLimit] = useState(50);

  // Features list
  const [features, setFeatures] = useState([]);
  const [featureInput, setFeatureInput] = useState('');

  // Status & flags
  const [isPopular, setIsPopular] = useState(false);
  const [active, setActive] = useState(true);

  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (plan) {
      setName(plan.name || '');
      setPrice(plan.price !== undefined ? String(plan.price) : '');
      setYearlyPrice(plan.yearlyPrice !== undefined && plan.yearlyPrice > 0 ? String(plan.yearlyPrice) : '');
      setBillingCycle(plan.billingCycle || 'monthly');
      setDescription(plan.description || '');
      setBadge(plan.badge || '');
      setSupportLevel(plan.supportLevel || 'Standard Support');

      const uLimit = plan.limitUsers ?? plan.maxUsers ?? 2;
      if (uLimit === -1 || uLimit === 'Unlimited') {
        setIsUnlimitedUsers(true);
        setLimitUsers(2);
      } else {
        setIsUnlimitedUsers(false);
        setLimitUsers(Number(uLimit) || 0);
      }

      const tLimit = plan.limitTechs ?? plan.maxTechnicians ?? 2;
      if (tLimit === -1 || tLimit === 'Unlimited') {
        setIsUnlimitedTechs(true);
        setLimitTechs(2);
      } else {
        setIsUnlimitedTechs(false);
        setLimitTechs(Number(tLimit) || 0);
      }

      const rLimit = plan.repairTicketLimit;
      if (rLimit === -1 || rLimit === undefined || rLimit === null) {
        setIsUnlimitedRepairs(true);
        setRepairTicketLimit(50);
      } else {
        setIsUnlimitedRepairs(false);
        setRepairTicketLimit(Number(rLimit) || 0);
      }

      setFeatures(Array.isArray(plan.features) ? [...plan.features] : []);
      setIsPopular(Boolean(plan.isPopular));
      setActive(plan.active !== undefined ? Boolean(plan.active) : true);
    } else {
      // Defaults for new plan
      setName('');
      setPrice('');
      setYearlyPrice('');
      setBillingCycle('monthly');
      setDescription('');
      setBadge('');
      setSupportLevel('Standard Support');
      setIsUnlimitedUsers(false);
      setLimitUsers(2);
      setIsUnlimitedTechs(false);
      setLimitTechs(2);
      setIsUnlimitedRepairs(true);
      setRepairTicketLimit(50);
      setFeatures([
        'Dashboard & CRM',
        'Repair Tickets',
        'POS Billing',
        'Standard Support',
      ]);
      setIsPopular(false);
      setActive(true);
    }
    setErrorMsg('');
  }, [plan, isOpen]);

  if (!isOpen) return null;

  const handleAddFeature = (featText) => {
    const text = (featText || featureInput).trim();
    if (!text) return;
    if (features.includes(text)) {
      toast.info(`"${text}" is already in the feature list.`);
      return;
    }
    setFeatures([...features, text]);
    setFeatureInput('');
  };

  const handleRemoveFeature = (idx) => {
    setFeatures(features.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name.trim()) {
      setErrorMsg('Plan name is required.');
      return;
    }

    const numPrice = Number(price);
    if (isNaN(numPrice) || numPrice < 0) {
      setErrorMsg('Monthly price must be a valid positive number.');
      return;
    }

    const numYearly = yearlyPrice.trim() !== '' ? Number(yearlyPrice) : 0;
    if (isNaN(numYearly) || numYearly < 0) {
      setErrorMsg('Yearly price must be a valid positive number.');
      return;
    }

    if (features.length === 0) {
      setErrorMsg('Please include at least one feature for this plan.');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        name: name.trim(),
        price: numPrice,
        yearlyPrice: numYearly,
        billingCycle,
        description: description.trim(),
        badge: badge.trim(),
        supportLevel: supportLevel.trim(),
        limitUsers: isUnlimitedUsers ? -1 : Math.max(0, parseInt(limitUsers, 10) || 0),
        limitTechs: isUnlimitedTechs ? -1 : Math.max(0, parseInt(limitTechs, 10) || 0),
        repairTicketLimit: isUnlimitedRepairs ? -1 : Math.max(0, parseInt(repairTicketLimit, 10) || 0),
        features,
        isPopular,
        active,
      };

      let result;
      if (isEditing) {
        result = await api.patch(`/admin/plans/${plan._id}`, payload);
        toast.success(`Subscription plan "${name.trim()}" updated successfully.`);
      } else {
        result = await api.post('/admin/plans', payload);
        toast.success(`Subscription plan "${name.trim()}" created successfully.`);
      }

      if (onSuccess) onSuccess(result);
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to save subscription plan';
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!plan || !plan._id) return;

    if (plan.activeTenantCount > 0) {
      toast.error(`Cannot delete "${plan.name}" because ${plan.activeTenantCount} active workshop(s) are subscribed. Deactivate the plan instead.`);
      return;
    }

    if (!window.confirm(`Are you sure you want to permanently delete subscription plan "${plan.name}"? This action cannot be undone.`)) {
      return;
    }

    setIsDeleting(true);
    try {
      await api.delete(`/admin/plans/${plan._id}`);
      toast.success(`Subscription plan "${plan.name}" deleted.`);
      if (onSuccess) onSuccess(null);
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to delete plan';
      toast.error(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleArchive = async () => {
    if (!plan || !plan._id) return;
    if (
      !window.confirm(
        `Are you sure you want to safely archive plan "${plan.name}"? Existing subscribed workshops will remain active, but new workshops will not be able to select this tier.`
      )
    ) {
      return;
    }
    setIsSaving(true);
    try {
      await api.post(`/admin/plans/${plan._id}/archive`);
      toast.success(`Plan "${plan.name}" has been safely archived.`);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to archive plan');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUnarchive = async () => {
    if (!plan || !plan._id) return;
    if (!window.confirm(`Restore plan "${plan.name}" from archive?`)) {
      return;
    }
    setIsSaving(true);
    try {
      await api.post(`/admin/plans/${plan._id}/unarchive`);
      toast.success(`Plan "${plan.name}" has been restored from archive.`);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to restore plan');
    } finally {
      setIsSaving(false);
    }
  };

  // Common input styles
  const inputStyle = {
    display: 'block',
    width: '100%',
    boxSizing: 'border-box',
    height: '42px',
    padding: '8px 14px',
    fontSize: '13.5px',
    color: '#0f172a',
    backgroundColor: '#ffffff',
    border: '1.5px solid #cbd5e1',
    borderRadius: '8px',
    outline: 'none',
    transition: 'all 0.15s ease-in-out',
  };

  const labelStyle = {
    display: 'block',
    fontSize: '12.5px',
    fontWeight: '700',
    color: '#334155',
    marginBottom: '6px',
    lineHeight: '1.4',
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.72)',
        backdropFilter: 'blur(5px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px 16px',
      }}
      onClick={onClose}
    >
      <div
        className="card"
        style={{
          maxWidth: '720px',
          width: '100%',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          overflow: 'hidden',
          borderRadius: '14px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
          backgroundColor: '#ffffff',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '20px 28px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: '#ffffff',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  display: 'inline-block',
                  width: '9px',
                  height: '9px',
                  borderRadius: '50%',
                  backgroundColor: '#2563eb',
                }}
              />
              <h2 style={{ fontSize: '18px', fontWeight: '800', margin: 0, color: '#0f172a' }}>
                {isEditing ? `Modify Plan: ${plan.name}` : 'Create Subscription Plan'}
              </h2>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748b' }}>
              {isEditing
                ? 'Configure pricing, tenant user allocations, technician capacity, and included features.'
                : 'Define a new SaaS subscription tier for workshop tenants.'}
            </p>
          </div>
          <button
            type="button"
            className="btn-icon"
            onClick={onClose}
            aria-label="Close modal"
            style={{
              border: 'none',
              background: '#f1f5f9',
              borderRadius: '8px',
              padding: '8px',
              cursor: 'pointer',
              color: '#64748b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Archived Plan Banner */}
        {isEditing && plan?.isArchived && (
          <div
            style={{
              padding: '12px 28px',
              backgroundColor: '#fef2f2',
              borderBottom: '1px solid #fecaca',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              color: '#dc2626',
              fontSize: '13px',
            }}
          >
            <Archive size={16} style={{ flexShrink: 0 }} />
            <span>
              <strong>Archived Plan:</strong> This plan is safely archived. Existing subscribed workshops remain active and unaffected, but it is hidden from the public pricing matrix and new registrations.
            </span>
          </div>
        )}

        {/* Modal Scrollable Body */}
        <form
          id="plan-form"
          onSubmit={handleSubmit}
          style={{
            padding: '24px 28px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
          }}
        >
          {errorMsg && (
            <div
              style={{
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '8px',
                padding: '12px 16px',
                color: '#b91c1c',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <AlertTriangle size={16} style={{ flexShrink: 0 }} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Active Tenant Information & Deletion Protection Notice */}
          {isEditing && (
            <div
              style={{
                backgroundColor: plan.activeTenantCount > 0 ? '#eff6ff' : '#f8fafc',
                border: plan.activeTenantCount > 0 ? '1px solid #bfdbfe' : '1px solid #e2e8f0',
                borderRadius: '10px',
                padding: '14px 18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '8px',
                    backgroundColor: plan.activeTenantCount > 0 ? '#dbeafe' : '#e2e8f0',
                    color: plan.activeTenantCount > 0 ? '#1d4ed8' : '#64748b',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Users size={18} />
                </div>
                <div>
                  <strong style={{ fontSize: '13.5px', color: '#0f172a', display: 'block' }}>
                    {plan.activeTenantCount || 0} Active Workshop {plan.activeTenantCount === 1 ? 'Subscriber' : 'Subscribers'}
                  </strong>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                    {plan.activeTenantCount > 0
                      ? 'Plan is active across live workshop tenants. Pricing changes apply to new or renewal cycles.'
                      : 'No workshops are currently bound to this plan.'}
                  </div>
                </div>
              </div>
              <span className={`status-badge ${active ? 'badge-blue' : 'badge-gray'}`} style={{ padding: '4px 10px' }}>
                {active ? 'Available' : 'Deactivated'}
              </span>
            </div>
          )}

          {/* Section 1: Plan Details & Pricing */}
          <div>
            <div
              style={{
                fontSize: '12px',
                fontWeight: '800',
                textTransform: 'uppercase',
                letterSpacing: '0.6px',
                color: '#475569',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span>PLAN IDENTITY & PRICING</span>
              <div style={{ flex: 1, height: '1px', backgroundColor: '#e2e8f0' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '18px 20px' }}>
              {/* Plan Name */}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label style={labelStyle} htmlFor="plan-name-input">
                  Plan Name <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  id="plan-name-input"
                  type="text"
                  style={inputStyle}
                  placeholder="e.g. Starter Tier, Professional Tier"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              {/* Badge Tagline */}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label style={labelStyle} htmlFor="plan-badge-input">
                  Badge Tagline (Optional)
                </label>
                <input
                  id="plan-badge-input"
                  type="text"
                  style={inputStyle}
                  placeholder="e.g. Single Tech & Counter, Most Popular"
                  value={badge}
                  onChange={(e) => setBadge(e.target.value)}
                />
              </div>

              {/* Monthly Price */}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label style={labelStyle} htmlFor="plan-price-input">
                  Monthly Price (₹ / mo) <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  id="plan-price-input"
                  type="number"
                  min="0"
                  step="1"
                  style={inputStyle}
                  placeholder="e.g. 999 or 2499"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                />
              </div>

              {/* Annual Price */}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label style={labelStyle} htmlFor="plan-yearly-input">
                  Annual Rate (₹ / mo billed yearly)
                </label>
                <input
                  id="plan-yearly-input"
                  type="number"
                  min="0"
                  step="1"
                  style={inputStyle}
                  placeholder="e.g. 799 or 1999"
                  value={yearlyPrice}
                  onChange={(e) => setYearlyPrice(e.target.value)}
                />
              </div>

              {/* Billing Cycle */}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label style={labelStyle} htmlFor="plan-cycle-select">
                  Billing Period
                </label>
                <select
                  id="plan-cycle-select"
                  style={inputStyle}
                  value={billingCycle}
                  onChange={(e) => setBillingCycle(e.target.value)}
                >
                  <option value="monthly">Monthly Cycle</option>
                  <option value="quarterly">Quarterly (3 Months)</option>
                  <option value="yearly">Yearly (Annual)</option>
                </select>
              </div>

              {/* Support SLA Level */}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label style={labelStyle} htmlFor="plan-support-select">
                  Support SLA Level
                </label>
                <select
                  id="plan-support-select"
                  style={inputStyle}
                  value={supportLevel}
                  onChange={(e) => setSupportLevel(e.target.value)}
                >
                  <option value="Standard Support">Standard Support</option>
                  <option value="Priority Support">Priority Support (WhatsApp & Phone)</option>
                  <option value="Dedicated Account Manager">Dedicated Account Manager (24/7 SLA)</option>
                </select>
              </div>
            </div>

            {/* Description */}
            <div style={{ marginTop: '18px', display: 'flex', flexDirection: 'column' }}>
              <label style={labelStyle} htmlFor="plan-desc-input">
                Description
              </label>
              <textarea
                id="plan-desc-input"
                rows={2}
                style={{
                  ...inputStyle,
                  height: 'auto',
                  padding: '10px 14px',
                  resize: 'vertical',
                }}
                placeholder="Brief summary of who this plan is tailored for..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>

          {/* Section 2: Resource Allocations & Limits */}
          <div>
            <div
              style={{
                fontSize: '12px',
                fontWeight: '800',
                textTransform: 'uppercase',
                letterSpacing: '0.6px',
                color: '#475569',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span>TENANT CAPACITY & LIMITS</span>
              <div style={{ flex: 1, height: '1px', backgroundColor: '#e2e8f0' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
              {/* Operator Staff Limit */}
              <div
                style={{
                  border: '1.5px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '14px',
                  backgroundColor: '#f8fafc',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <label style={{ margin: 0, fontSize: '12.5px', fontWeight: '700', color: '#1e293b' }}>
                      Staff Limit
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', fontWeight: '700', cursor: 'pointer', color: isUnlimitedUsers ? '#2563eb' : '#64748b' }}>
                      <input
                        type="checkbox"
                        checked={isUnlimitedUsers}
                        onChange={(e) => setIsUnlimitedUsers(e.target.checked)}
                      />
                      Unlimited
                    </label>
                  </div>
                  {isUnlimitedUsers ? (
                    <div style={{ height: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#eff6ff', borderRadius: '8px', fontSize: '13px', fontWeight: '800', color: '#2563eb', border: '1px solid #bfdbfe' }}>
                      Unlimited Staff
                    </div>
                  ) : (
                    <input
                      type="number"
                      min="1"
                      style={inputStyle}
                      placeholder="e.g. 2, 6, 10"
                      value={limitUsers}
                      onChange={(e) => setLimitUsers(e.target.value)}
                      required={!isUnlimitedUsers}
                    />
                  )}
                </div>
                <span style={{ fontSize: '11px', color: '#94a3b8', marginTop: '8px', display: 'block', lineHeight: 1.3 }}>
                  Staff logins allowed
                </span>
              </div>

              {/* Technician Seats Limit */}
              <div
                style={{
                  border: '1.5px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '14px',
                  backgroundColor: '#f8fafc',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <label style={{ margin: 0, fontSize: '12.5px', fontWeight: '700', color: '#1e293b' }}>
                      Technicians
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', fontWeight: '700', cursor: 'pointer', color: isUnlimitedTechs ? '#2563eb' : '#64748b' }}>
                      <input
                        type="checkbox"
                        checked={isUnlimitedTechs}
                        onChange={(e) => setIsUnlimitedTechs(e.target.checked)}
                      />
                      Unlimited
                    </label>
                  </div>
                  {isUnlimitedTechs ? (
                    <div style={{ height: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#eff6ff', borderRadius: '8px', fontSize: '13px', fontWeight: '800', color: '#2563eb', border: '1px solid #bfdbfe' }}>
                      Unlimited Seats
                    </div>
                  ) : (
                    <input
                      type="number"
                      min="1"
                      style={inputStyle}
                      placeholder="e.g. 2, 5, 25"
                      value={limitTechs}
                      onChange={(e) => setLimitTechs(e.target.value)}
                      required={!isUnlimitedTechs}
                    />
                  )}
                </div>
                <span style={{ fontSize: '11px', color: '#94a3b8', marginTop: '8px', display: 'block', lineHeight: 1.3 }}>
                  Bench capacity seats
                </span>
              </div>

              {/* Monthly Repair Tickets */}
              <div
                style={{
                  border: '1.5px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '14px',
                  backgroundColor: '#f8fafc',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <label style={{ margin: 0, fontSize: '12.5px', fontWeight: '700', color: '#1e293b' }}>
                      Repair Tickets
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', fontWeight: '700', cursor: 'pointer', color: isUnlimitedRepairs ? '#2563eb' : '#64748b' }}>
                      <input
                        type="checkbox"
                        checked={isUnlimitedRepairs}
                        onChange={(e) => setIsUnlimitedRepairs(e.target.checked)}
                      />
                      Unlimited
                    </label>
                  </div>
                  {isUnlimitedRepairs ? (
                    <div style={{ height: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#eff6ff', borderRadius: '8px', fontSize: '13px', fontWeight: '800', color: '#2563eb', border: '1px solid #bfdbfe' }}>
                      Unlimited Tickets
                    </div>
                  ) : (
                    <input
                      type="number"
                      min="1"
                      style={inputStyle}
                      placeholder="e.g. 50"
                      value={repairTicketLimit}
                      onChange={(e) => setRepairTicketLimit(e.target.value)}
                      required={!isUnlimitedRepairs}
                    />
                  )}
                </div>
                <span style={{ fontSize: '11px', color: '#94a3b8', marginTop: '8px', display: 'block', lineHeight: 1.3 }}>
                  Monthly repair jobs quota
                </span>
              </div>
            </div>
          </div>

          {/* Section 3: Included Features */}
          <div>
            <div
              style={{
                fontSize: '12px',
                fontWeight: '800',
                textTransform: 'uppercase',
                letterSpacing: '0.6px',
                color: '#475569',
                marginBottom: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span>INCLUDED FEATURES ({features.length})</span>
              <div style={{ flex: 1, height: '1px', backgroundColor: '#e2e8f0' }} />
            </div>

            {/* Quick preset badges */}
            <div style={{ marginBottom: '14px' }}>
              <span style={{ fontSize: '11.5px', fontWeight: '600', color: '#64748b', display: 'block', marginBottom: '8px' }}>
                Quick Presets (Click to add):
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {PRESET_FEATURES.map((item, idx) => {
                  const isAdded = features.includes(item);
                  return (
                    <button
                      type="button"
                      key={idx}
                      onClick={() => !isAdded && handleAddFeature(item)}
                      style={{
                        fontSize: '11.5px',
                        padding: '4px 10px',
                        borderRadius: '20px',
                        border: isAdded ? '1px solid #cbd5e1' : '1px solid #bfdbfe',
                        backgroundColor: isAdded ? '#f1f5f9' : '#eff6ff',
                        color: isAdded ? '#94a3b8' : '#1d4ed8',
                        cursor: isAdded ? 'default' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        fontWeight: '600',
                        transition: 'all 0.15s ease',
                      }}
                      disabled={isAdded}
                    >
                      {isAdded ? <Check size={11} /> : <Plus size={11} />}
                      {item}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Feature input bar */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
              <input
                type="text"
                style={{ ...inputStyle, flex: 1 }}
                placeholder="Type a custom feature name..."
                value={featureInput}
                onChange={(e) => setFeatureInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddFeature();
                  }
                }}
              />
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => handleAddFeature()}
                style={{ flexShrink: 0, height: '42px', padding: '0 16px' }}
              >
                <Plus size={15} /> Add Feature
              </button>
            </div>

            {/* Features list items */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: features.length > 4 ? 'repeat(2, 1fr)' : '1fr',
                gap: '8px',
                maxHeight: '180px',
                overflowY: 'auto',
                border: '1.5px solid #e2e8f0',
                borderRadius: '10px',
                padding: '10px',
                backgroundColor: '#f8fafc',
              }}
            >
              {features.length === 0 ? (
                <div style={{ padding: '16px', textAlign: 'center', fontSize: '13px', color: '#94a3b8', gridColumn: '1 / -1' }}>
                  No features added yet. Type above or click suggestions to add features.
                </div>
              ) : (
                features.map((feat, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      backgroundColor: '#ffffff',
                      border: '1px solid #e2e8f0',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      fontSize: '12.5px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#1e293b', overflow: 'hidden' }}>
                      <Check size={15} style={{ color: '#059669', flexShrink: 0 }} />
                      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{feat}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveFeature(idx)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#ef4444',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                      title="Remove feature"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Section 4: Visibility & Promotion */}
          <div
            style={{
              borderTop: '1px solid #e2e8f0',
              paddingTop: '18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
            }}
          >
            <div
              style={{
                border: '1.5px solid #e2e8f0',
                borderRadius: '10px',
                padding: '14px 16px',
                backgroundColor: isPopular ? '#eff6ff' : '#f8fafc',
                borderColor: isPopular ? '#bfdbfe' : '#e2e8f0',
                transition: 'all 0.15s ease',
              }}
            >
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  fontSize: '13.5px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  color: '#0f172a',
                  margin: 0,
                }}
              >
                <input
                  type="checkbox"
                  checked={isPopular}
                  onChange={(e) => setIsPopular(e.target.checked)}
                  style={{ width: '17px', height: '17px', cursor: 'pointer' }}
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Sparkles size={16} style={{ color: '#2563eb' }} />
                  <span>Set as "Most Popular" / Featured Tier</span>
                </div>
              </label>
              <span style={{ fontSize: '12px', color: '#64748b', marginLeft: '27px', display: 'block', marginTop: '4px' }}>
                Highlights this plan with a blue ribbon on the Super Admin matrix and public Home Page.
              </span>
            </div>

            <div
              style={{
                border: '1.5px solid #e2e8f0',
                borderRadius: '10px',
                padding: '14px 16px',
                backgroundColor: active ? '#ffffff' : '#f8fafc',
              }}
            >
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  fontSize: '13.5px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  color: '#0f172a',
                  margin: 0,
                }}
              >
                <input
                  type="checkbox"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                  style={{ width: '17px', height: '17px', cursor: 'pointer' }}
                />
                <span>Active Plan (Available for new workshop subscriptions)</span>
              </label>
              <span style={{ fontSize: '12px', color: '#64748b', marginLeft: '27px', display: 'block', marginTop: '4px' }}>
                When unchecked, this plan is hidden from the public Home Page and cannot be chosen during registration. Existing active subscribers remain unaffected.
              </span>
            </div>
          </div>
        </form>

        {/* Modal Footer */}
        <div
          style={{
            padding: '16px 28px',
            borderTop: '1px solid #e2e8f0',
            backgroundColor: '#ffffff',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', gap: '8px' }}>
            {isEditing && (
              <>
                {plan.isArchived ? (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleUnarchive}
                    disabled={isDeleting || isSaving}
                    style={{
                      color: '#059669',
                      borderColor: '#a7f3d0',
                      height: '40px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <Archive size={14} /> Restore Plan
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleArchive}
                    disabled={isDeleting || isSaving}
                    style={{
                      color: '#475569',
                      height: '40px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <Archive size={14} /> Archive Plan
                  </button>
                )}

                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleDelete}
                  disabled={isDeleting || isSaving}
                  style={{
                    color: plan.activeTenantCount > 0 ? '#94a3b8' : '#ef4444',
                    borderColor: plan.activeTenantCount > 0 ? '#e2e8f0' : '#fca5a5',
                    height: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                  title={plan.activeTenantCount > 0 ? 'Cannot delete plan with active subscribers' : 'Permanently delete plan'}
                >
                  <Trash2 size={14} /> {isDeleting ? 'Deleting...' : 'Delete Plan'}
                </button>
              </>
            )}
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={isSaving || isDeleting}
              style={{ height: '40px' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              form="plan-form"
              className="btn btn-primary"
              disabled={isSaving || isDeleting}
              style={{ height: '40px' }}
            >
              {isSaving ? 'Saving Plan...' : isEditing ? 'Save Changes' : 'Create Plan'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
