import React, { useState } from 'react';
import { AlertTriangle, Clock, CreditCard } from 'lucide-react';
import { ClientSidebar } from './ClientSidebar.jsx';
import { Header } from './Header.jsx';
import { ErrorBoundary } from '../common/ErrorBoundary.jsx';
import { AiFloatingAssistant } from './AiFloatingAssistant.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { calculateRemainingDays, formatDateDMY, formatTime12h } from '../../utils/formatters.js';
import { RenewSubscriptionModal } from '../../modules/auth/components/RenewSubscriptionModal.jsx';

export const MainLayout = ({ children, title = 'Operational Workbench', subtitle = 'Shop Operations' }) => {
  const { user, currentShop, refreshUser } = useAuth();
  const [showRenewModal, setShowRenewModal] = useState(false);

  React.useEffect(() => {
    document.title = title ? `Zapate Service Manager | ${title}` : 'Zapate Service Manager';
  }, [title]);

  const expiryDate = currentShop?.subscriptionExpiresAt;
  const isExpiringSoon = (() => {
    if (!expiryDate || user?.role === 'SUPER_ADMIN') return false;
    const remaining = typeof currentShop.daysRemaining === 'number'
      ? currentShop.daysRemaining
      : calculateRemainingDays(expiryDate, currentShop.serverTime || new Date());
    return remaining <= 7 && remaining > 0;
  })();

  const daysRemaining = (() => {
    if (!expiryDate) return null;
    return typeof currentShop.daysRemaining === 'number'
      ? currentShop.daysRemaining
      : calculateRemainingDays(expiryDate, currentShop.serverTime || new Date());
  })();

  return (
    <div className="app-shell">
      <ClientSidebar />
      <div className="main-content">
        <Header title={title} subtitle={subtitle} isAdmin={false} />

        {/* Expiring Soon In-App Subscription Banner */}
        {isExpiringSoon && (
          <div
            style={{
              backgroundColor: '#fffbeb',
              borderBottom: '1px solid #fde68a',
              padding: '10px 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              color: '#92400e',
              fontSize: '13px',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={16} style={{ color: '#d97706', flexShrink: 0 }} />
              <span>
                <strong>Subscription Alert:</strong> Your workshop's{' '}
                <strong>"{currentShop.subscription || 'Starter'}"</strong> plan expires in{' '}
                <strong>{daysRemaining === 1 ? '1 day' : `${daysRemaining} days`}</strong> (
                {formatDateDMY(expiryDate)} at {formatTime12h(expiryDate)}). Renew your subscription now to avoid automated account suspension.
              </span>
            </div>

            <button
              type="button"
              className="btn btn-sm"
              onClick={() => setShowRenewModal(true)}
              style={{
                backgroundColor: '#d97706',
                color: '#ffffff',
                border: 'none',
                fontWeight: '700',
                padding: '5px 14px',
                borderRadius: '6px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
              }}
            >
              <CreditCard size={13} /> Renew Subscription
            </button>
          </div>
        )}

        <main className="page-container">
          <ErrorBoundary inLayout={true}>{children}</ErrorBoundary>
        </main>
      </div>
      <AiFloatingAssistant />

      {/* Renew Subscription Modal */}
      {showRenewModal && currentShop && (
        <RenewSubscriptionModal
          shopId={currentShop._id}
          shopName={currentShop.name}
          currentPlan={currentShop.subscription}
          onClose={() => setShowRenewModal(false)}
          onSuccess={() => {
            setShowRenewModal(false);
            refreshUser();
          }}
        />
      )}
    </div>
  );
};

