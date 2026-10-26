import React, { useState, useEffect } from 'react';
import {
  X,
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Zap,
  ArrowRight,
  Store,
  RefreshCw,
  AlertTriangle,
  Lock,
} from 'lucide-react';
import { toast } from 'sonner';
import api from '../../../services/api.js';

export const RenewSubscriptionModal = ({
  shopId,
  shopName,
  currentPlan,
  onClose,
  onSuccess,
}) => {
  const [plans, setPlans] = useState([]);
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [paymentMethod, setPaymentMethod] = useState('Online UPI / QR Payment');
  const [referenceId, setReferenceId] = useState(() => `REN-PAY-${Math.floor(100000 + Math.random() * 900000)}`);
  const [ownerEmail, setOwnerEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingPlans, setIsLoadingPlans] = useState(true);

  useEffect(() => {
    fetchPlans();
  }, [shopId]);

  const fetchPlans = async () => {
    setIsLoadingPlans(true);
    try {
      // First try fetching public plans
      const res = await api.get('/plans');
      const planList = Array.isArray(res) ? res : res?.plans || [];
      const activePlans = planList.filter((p) => p.active !== false && !p.isArchived);
      setPlans(activePlans);

      if (activePlans.length > 0) {
        // Pre-select current plan if matches, else first plan
        const match = activePlans.find(
          (p) =>
            p.name.toLowerCase() === (currentPlan || '').toLowerCase() ||
            p._id === currentPlan
        );
        setSelectedPlanId(match ? match._id : activePlans[0]._id);
      }
    } catch (err) {
      console.error('Failed to load plans for renewal:', err);
      toast.error('Failed to load subscription plans. Please try again.');
    } finally {
      setIsLoadingPlans(false);
    }
  };

  const selectedPlanObj = plans.find((p) => p._id === selectedPlanId);

  const calculatePrice = () => {
    if (!selectedPlanObj) return 0;
    if (billingCycle === 'yearly') {
      return selectedPlanObj.yearlyPrice > 0 ? selectedPlanObj.yearlyPrice * 12 : selectedPlanObj.price * 12 * 0.8;
    }
    return selectedPlanObj.price;
  };

  const handleRenew = async (e) => {
    e.preventDefault();
    if (!shopId) {
      toast.error('Workshop identifier missing. Please try signing in again.');
      return;
    }

    if (!selectedPlanId) {
      toast.error('Please select a subscription plan to continue.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        planId: selectedPlanId,
        billingCycle,
        paymentMethod,
        referenceId: referenceId.trim() || `REN-PAY-${Date.now()}`,
        amount: calculatePrice(),
        ownerEmail: ownerEmail.trim() || undefined,
        password: password || undefined,
      };

      const res = await api.post(`/shops/${shopId}/renew`, payload);
      toast.success(res?.message || 'Subscription renewed successfully! You can now sign in.');
      if (onSuccess) onSuccess(res);
      if (onClose) onClose();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Renewal failed. Please check details.';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
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
        overflowY: 'auto',
      }}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: '640px',
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
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'rgba(239, 68, 68, 0.2)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#f87171',
              }}
            >
              <RefreshCw size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#ffffff', margin: 0 }}>
                Renew Workshop Subscription
              </h3>
              <p style={{ fontSize: '12px', color: '#94a3b8', margin: '2px 0 0' }}>
                Restore full access for <strong>{shopName || 'Your Workshop'}</strong>
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

        {/* Content Body */}
        <form onSubmit={handleRenew} style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
          {/* Expiry Notice Banner */}
          <div
            style={{
              padding: '12px 16px',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
            }}
          >
            <AlertTriangle size={18} style={{ color: '#ef4444', flexShrink: 0, marginTop: '2px' }} />
            <div style={{ fontSize: '13px', color: '#991b1b', lineHeight: 1.4 }}>
              <strong>Your subscription has expired.</strong> All customer repair job cards,
              inventory catalog, invoices, and warranties have been safely preserved in your database.
              Select a renewal plan below to restore workshop features immediately.
            </div>
          </div>

          {/* Billing Cycle Switcher */}
          <div style={{ marginBottom: '16px' }}>
            <label className="form-label" style={{ marginBottom: '8px' }}>Billing Cycle</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setBillingCycle('monthly')}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '8px',
                  border: billingCycle === 'monthly' ? '2px solid #2563eb' : '1px solid #cbd5e1',
                  background: billingCycle === 'monthly' ? '#eff6ff' : '#ffffff',
                  color: billingCycle === 'monthly' ? '#1d4ed8' : '#475569',
                  fontWeight: '700',
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                Monthly Plan
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle('yearly')}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '8px',
                  border: billingCycle === 'yearly' ? '2px solid #2563eb' : '1px solid #cbd5e1',
                  background: billingCycle === 'yearly' ? '#eff6ff' : '#ffffff',
                  color: billingCycle === 'yearly' ? '#1d4ed8' : '#475569',
                  fontWeight: '700',
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                <span>Annual (365 Days)</span>
                <span
                  style={{
                    background: '#10b981',
                    color: '#ffffff',
                    fontSize: '10px',
                    padding: '2px 6px',
                    borderRadius: '10px',
                    fontWeight: '800',
                  }}
                >
                  SAVE 20%
                </span>
              </button>
            </div>
          </div>

          {/* Plan Selection Cards */}
          <div style={{ marginBottom: '20px' }}>
            <label className="form-label" style={{ marginBottom: '8px' }}>Select Subscription Tier</label>
            {isLoadingPlans ? (
              <div style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>
                <RefreshCw size={20} className="animate-spin" />
                <span style={{ marginLeft: '8px' }}>Loading available plans...</span>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '12px' }}>
                {plans.map((p) => {
                  const isSelected = selectedPlanId === p._id;
                  const price = billingCycle === 'yearly' ? (p.yearlyPrice || Math.round(p.price * 0.8)) : p.price;
                  return (
                    <div
                      key={p._id}
                      onClick={() => setSelectedPlanId(p._id)}
                      style={{
                        padding: '14px',
                        borderRadius: '10px',
                        border: isSelected ? '2px solid #2563eb' : '1.5px solid #e2e8f0',
                        background: isSelected ? '#f8faff' : '#ffffff',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        position: 'relative',
                      }}
                    >
                      {isSelected && (
                        <div
                          style={{
                            position: 'absolute',
                            top: '8px',
                            right: '8px',
                            color: '#2563eb',
                          }}
                        >
                          <CheckCircle2 size={16} />
                        </div>
                      )}
                      <strong style={{ display: 'block', fontSize: '14px', color: '#0f172a' }}>
                        {p.name}
                      </strong>
                      <div style={{ fontSize: '18px', fontWeight: '800', color: '#2563eb', margin: '4px 0' }}>
                        ₹{price.toLocaleString('en-IN')}
                        <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 'normal' }}>
                          /{billingCycle === 'yearly' ? 'mo (billed yr)' : 'mo'}
                        </span>
                      </div>
                      <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '6px' }}>
                        {p.limitUsers === -1 ? 'Unlimited' : p.limitUsers} Staff Users •{' '}
                        {p.limitTechs === -1 ? 'Unlimited' : p.limitTechs} Techs
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Payment Method & Mock Reference */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '20px' }}>
            <div>
              <label className="form-label">Payment Method</label>
              <select
                className="select-control"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                <option value="Online UPI / QR Payment">Online UPI / QR Payment</option>
                <option value="Credit / Debit Card">Credit / Debit Card</option>
                <option value="Net Banking / NEFT">Net Banking / NEFT</option>
                <option value="Cash / Offline Invoice">Cash / Offline Invoice</option>
              </select>
            </div>
            <div>
              <label className="form-label">Transaction / Reference ID</label>
              <input
                type="text"
                className="input-control"
                value={referenceId}
                onChange={(e) => setReferenceId(e.target.value)}
                placeholder="e.g. REN-UPI-9482"
                style={{ fontFamily: 'JetBrains Mono', fontSize: '12px' }}
              />
            </div>
          </div>

          {/* Total Summary Box */}
          <div
            style={{
              padding: '14px 18px',
              borderRadius: '10px',
              background: '#f1f5f9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '20px',
            }}
          >
            <div>
              <div style={{ fontSize: '12px', color: '#64748b' }}>Total Renewal Fee</div>
              <strong style={{ fontSize: '18px', color: '#0f172a' }}>
                ₹{calculatePrice().toLocaleString('en-IN')}
              </strong>
            </div>
            <div style={{ textAlign: 'right', fontSize: '12px', color: '#059669', fontWeight: '600' }}>
              Instant Access Reactivation
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting || isLoadingPlans}
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '14px',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            {isSubmitting ? (
              <>
                <RefreshCw size={16} className="animate-spin" /> Activating Renewal...
              </>
            ) : (
              <>
                <ShieldCheck size={16} /> Confirm & Activate Subscription
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
