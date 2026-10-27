import React, { useState, useEffect, useMemo } from 'react';
import {
  Clock,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';
import { formatDateDMY, formatTime12h } from '../../utils/formatters.js';
import {
  broadcastSubscriptionExpired,
  clearActiveSession,
  setExpiredNotice,
  getActiveUser,
} from '../../utils/sessionManager.js';
import { RenewSubscriptionModal } from '../../modules/auth/components/RenewSubscriptionModal.jsx';

export const SubscriptionCountdownBar = ({
  shop,
  serverTime: initialServerTime,
  onRenewSuccess,
}) => {
  const [showRenewModal, setShowRenewModal] = useState(false);

  // Stable server time offset
  const serverOffsetRef = React.useRef(0);
  useEffect(() => {
    if (initialServerTime) {
      const sTime = new Date(initialServerTime).getTime();
      if (!isNaN(sTime)) {
        serverOffsetRef.current = sTime - Date.now();
      }
    }
  }, [initialServerTime]);

  const [currentServerTime, setCurrentServerTime] = useState(() => {
    if (initialServerTime) {
      const sTime = new Date(initialServerTime).getTime();
      if (!isNaN(sTime)) return sTime;
    }
    return Date.now();
  });

  const rawExpiresAt = shop?.subscriptionExpiresAt || shop?.expiresAt;
  const rawStartDate = shop?.subscriptionStartDate || shop?.startDate;
  const expiresAt = useMemo(() => (rawExpiresAt ? new Date(rawExpiresAt) : null), [rawExpiresAt]);
  const startDate = useMemo(() => (rawStartDate ? new Date(rawStartDate) : null), [rawStartDate]);
  const planName = shop?.subscription || shop?.plan || 'Workshop Plan';
  const billingCycle = shop?.subscriptionBillingCycle || shop?.billingCycle || 'monthly';

  // 1-second server time synchronization tick
  useEffect(() => {
    const updateTick = () => {
      setCurrentServerTime(Date.now() + serverOffsetRef.current);
    };
    updateTick();
    const timer = setInterval(updateTick, 1000);

    return () => clearInterval(timer);
  }, []);

  // Derived countdown state
  const countdown = useMemo(() => {
    if (!expiresAt || isNaN(expiresAt.getTime())) {
      return { isExpired: false, days: 0, hours: 0, minutes: 0, seconds: 0, totalMs: 0 };
    }

    const expiryMs = expiresAt.getTime();
    const diffMs = expiryMs - currentServerTime;

    if (diffMs <= 0) {
      return { isExpired: true, days: 0, hours: 0, minutes: 0, seconds: 0, totalMs: 0 };
    }

    const days = Math.floor(diffMs / (24 * 60 * 60 * 1000));
    const hours = Math.floor((diffMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    const minutes = Math.floor((diffMs % (60 * 60 * 1000)) / (60 * 1000));
    const seconds = Math.floor((diffMs % (60 * 1000)) / 1000);

    return {
      isExpired: false,
      days,
      hours,
      minutes,
      seconds,
      totalMs: diffMs,
    };
  }, [expiresAt, currentServerTime]);

  if (!expiresAt) return null;

  const isExpired = countdown.isExpired || String(shop?.subscriptionStatus || shop?.status || '').toUpperCase() === 'EXPIRED';
  const isExpiringSoon = !isExpired && countdown.days <= 7;
  const isFinalDay = !isExpired && countdown.days === 0;

  // Exact unified rule for Days Remaining label to match countdown box
  const badgeLabel = isExpired
    ? 'Subscription Expired'
    : countdown.days > 1
    ? `${countdown.days} Days Remaining`
    : countdown.days === 1
    ? '1 Day Remaining'
    : `Expires Today (${countdown.hours}h left)`;

  // Theme styling based on urgency
  const statusTheme = isExpired
    ? {
        bg: 'linear-gradient(135deg, #450a0a 0%, #1e1b4b 100%)',
        border: '#dc2626',
        badgeBg: 'rgba(239, 68, 68, 0.2)',
        badgeColor: '#fca5a5',
        badgeBorder: '#ef4444',
        accentColor: '#f87171',
        label: badgeLabel,
      }
    : isExpiringSoon
    ? {
        bg: 'linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%)',
        border: isFinalDay ? '#ef4444' : countdown.days <= 3 ? '#f59e0b' : '#3b82f6',
        badgeBg: isFinalDay ? 'rgba(239, 68, 68, 0.2)' : countdown.days <= 3 ? 'rgba(245, 158, 11, 0.2)' : 'rgba(59, 130, 246, 0.2)',
        badgeColor: isFinalDay ? '#fca5a5' : countdown.days <= 3 ? '#fcd34d' : '#93c5fd',
        badgeBorder: isFinalDay ? '#ef4444' : countdown.days <= 3 ? '#f59e0b' : '#3b82f6',
        accentColor: isFinalDay ? '#f87171' : countdown.days <= 3 ? '#fbbf24' : '#60a5fa',
        label: badgeLabel,
      }
    : {
        bg: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        border: 'rgba(59, 130, 246, 0.3)',
        badgeBg: 'rgba(16, 185, 129, 0.15)',
        badgeColor: '#6ee7b7',
        badgeBorder: '#10b981',
        accentColor: '#34d399',
        label: badgeLabel,
      };

  return (
    <>
      <div
        className="subscription-countdown-card"
        style={{
          background: statusTheme.bg,
          border: `1.5px solid ${statusTheme.border}`,
          borderRadius: '16px',
          padding: '20px 24px',
          marginBottom: '24px',
          color: '#ffffff',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.2)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Subtle decorative glow */}
        <div
          style={{
            position: 'absolute',
            top: '-40px',
            right: '-40px',
            width: '180px',
            height: '180px',
            borderRadius: '50%',
            background: isExpired ? 'radial-gradient(circle, rgba(239, 68, 68, 0.2) 0%, transparent 70%)' : 'radial-gradient(circle, rgba(59, 130, 246, 0.2) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '18px',
            position: 'relative',
            zIndex: 1,
          }}
        >
          {/* Left Column: Plan & Dates Info */}
          <div style={{ flex: '1 1 320px', minWidth: '280px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 12px',
                  borderRadius: '999px',
                  fontSize: '12px',
                  fontWeight: '700',
                  background: statusTheme.badgeBg,
                  color: statusTheme.badgeColor,
                  border: `1px solid ${statusTheme.badgeBorder}`,
                  letterSpacing: '0.02em',
                }}
              >
                {isExpired ? <ShieldAlert size={14} /> : isExpiringSoon ? <AlertTriangle size={14} /> : <ShieldCheck size={14} />}
                {statusTheme.label}
              </span>

              <span
                style={{
                  fontSize: '11px',
                  color: '#94a3b8',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  fontWeight: '600',
                }}
              >
                Server Time Synced
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#ffffff', margin: 0 }}>
                {planName}
              </h2>
              <span style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'capitalize' }}>
                • {billingCycle} cycle
              </span>
            </div>

            {/* Dates row */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '18px',
                marginTop: '10px',
                fontSize: '12.5px',
                color: '#cbd5e1',
                flexWrap: 'wrap',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Calendar size={14} style={{ color: '#94a3b8' }} />
                <span>
                  Start: <strong style={{ color: '#ffffff', fontFamily: 'JetBrains Mono, monospace' }}>{formatDateDMY(startDate)}</strong>
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock size={14} style={{ color: isExpired ? '#fca5a5' : statusTheme.accentColor }} />
                <span>
                  Expires: <strong style={{ color: isExpired ? '#fca5a5' : '#ffffff', fontFamily: 'JetBrains Mono, monospace' }}>{formatDateDMY(expiresAt)}</strong>
                  {' at '}
                  <span style={{ color: '#e2e8f0', fontFamily: 'JetBrains Mono, monospace' }}>{formatTime12h(expiresAt)}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Center Column: Live Server Countdown Digits */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(0, 0, 0, 0.35)',
              padding: '12px 18px',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            {/* Days */}
            <div style={{ textAlign: 'center', minWidth: '48px' }}>
              <div
                style={{
                  fontSize: '22px',
                  fontWeight: '800',
                  color: isExpired ? '#ef4444' : '#ffffff',
                  fontFamily: 'JetBrains Mono, monospace',
                  lineHeight: '1.1',
                }}
              >
                {String(countdown.days).padStart(2, '0')}
              </div>
              <div style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '700', marginTop: '2px' }}>
                Days
              </div>
            </div>

            <span style={{ fontSize: '18px', fontWeight: '700', color: 'rgba(255, 255, 255, 0.4)', marginBottom: '12px' }}>:</span>

            {/* Hours */}
            <div style={{ textAlign: 'center', minWidth: '48px' }}>
              <div
                style={{
                  fontSize: '22px',
                  fontWeight: '800',
                  color: isExpired ? '#ef4444' : '#ffffff',
                  fontFamily: 'JetBrains Mono, monospace',
                  lineHeight: '1.1',
                }}
              >
                {String(countdown.hours).padStart(2, '0')}
              </div>
              <div style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '700', marginTop: '2px' }}>
                Hours
              </div>
            </div>

            <span style={{ fontSize: '18px', fontWeight: '700', color: 'rgba(255, 255, 255, 0.4)', marginBottom: '12px' }}>:</span>

            {/* Mins */}
            <div style={{ textAlign: 'center', minWidth: '48px' }}>
              <div
                style={{
                  fontSize: '22px',
                  fontWeight: '800',
                  color: isExpired ? '#ef4444' : '#ffffff',
                  fontFamily: 'JetBrains Mono, monospace',
                  lineHeight: '1.1',
                }}
              >
                {String(countdown.minutes).padStart(2, '0')}
              </div>
              <div style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '700', marginTop: '2px' }}>
                Mins
              </div>
            </div>

            <span style={{ fontSize: '18px', fontWeight: '700', color: 'rgba(255, 255, 255, 0.4)', marginBottom: '12px' }}>:</span>

            {/* Secs */}
            <div style={{ textAlign: 'center', minWidth: '48px' }}>
              <div
                style={{
                  fontSize: '22px',
                  fontWeight: '800',
                  color: isExpired ? '#ef4444' : statusTheme.accentColor,
                  fontFamily: 'JetBrains Mono, monospace',
                  lineHeight: '1.1',
                }}
              >
                {String(countdown.seconds).padStart(2, '0')}
              </div>
              <div style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '700', marginTop: '2px' }}>
                Secs
              </div>
            </div>
          </div>

          {/* Right Column: Renewal Action Button */}
          <div>
            <button
              type="button"
              onClick={() => setShowRenewModal(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                borderRadius: '10px',
                fontSize: '13px',
                fontWeight: '700',
                background: isExpired
                  ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
                  : 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                color: '#ffffff',
                border: 'none',
                cursor: 'pointer',
                boxShadow: isExpired ? '0 4px 14px rgba(239, 68, 68, 0.4)' : '0 4px 14px rgba(37, 99, 235, 0.4)',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-1px)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
            >
              <RefreshCw size={15} />
              <span>{isExpired ? 'Renew Now to Restore Access' : 'Renew Subscription'}</span>
            </button>
          </div>
        </div>
      </div>

      {showRenewModal && (
        <RenewSubscriptionModal
          shopId={shop?._id || shop?.id}
          shopName={shop?.name}
          currentPlan={shop?.subscription}
          onClose={() => setShowRenewModal(false)}
          onSuccess={(res) => {
            setShowRenewModal(false);
            if (onRenewSuccess) onRenewSuccess(res);
          }}
        />
      )}
    </>
  );
};
