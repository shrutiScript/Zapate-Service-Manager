import React from 'react';
import { AdminLayout } from '../../../components/layout/AdminLayout.jsx';
import { formatCurrency } from '../../../utils/formatters.js';
import { Zap, Check, Shield, Users, Wrench, Edit3 } from 'lucide-react';
import { toast } from 'sonner';

export const PlanManagementPage = () => {
  const plans = [
    { name: 'Starter Tier', price: '₹999 / mo', shops: 18, limitUsers: 2, limitTechs: 2, features: ['Dashboard & CRM', 'Repair Tickets (Max 50/mo)', 'POS Billing', 'Standard Support'] },
    { name: 'Professional Tier', price: '₹2,499 / mo', shops: 22, limitUsers: 6, limitTechs: 5, features: ['Unlimited Repair Tickets', 'Full Parts Inventory Matrix', 'Supplier Procurement POs', 'SMS & WhatsApp Hub', 'Priority Support'] },
    { name: 'Enterprise Tier', price: '₹4,999 / mo', shops: 8, limitUsers: 'Unlimited', limitTechs: 'Unlimited', features: ['Multi-Branch Support', 'Used Mobile Marketplace', 'Automated Financial Ledger', 'Custom Domain & Invoicing', 'Dedicated Account Manager'] },
  ];

  return (
    <AdminLayout title="Subscription Plans" subtitle="SaaS Pricing Matrix">
      <div className="page-header">
        <div className="page-header-info">
          <div className="page-badge-eyebrow">
            <span /> SUBSCRIPTION MATRIX
          </div>
          <h1>SaaS Subscription Tiers</h1>
          <p>Configure user allocations, technician capacity limits, and pricing tiers across tenants.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
        {plans.map((p, idx) => {
          const isPopular = idx === 1;
          return (
            <div
              key={p.name}
              className="card"
              style={{
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                border: isPopular ? '2px solid #2563eb' : '1px solid var(--border-color)',
                boxShadow: isPopular ? '0 10px 25px -5px rgba(37, 99, 235, 0.15)' : 'none',
              }}
            >
              {isPopular && (
                <div
                  style={{
                    position: 'absolute',
                    top: '-12px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: '#2563eb',
                    color: '#fff',
                    padding: '2px 10px',
                    borderRadius: '12px',
                    fontSize: '11px',
                    fontWeight: '700',
                    textTransform: 'uppercase',
                  }}
                >
                  Most Popular
                </div>
              )}

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="status-badge badge-blue">{p.shops} Active Tenants</span>
                </div>
                <h2 style={{ fontSize: '18px', fontWeight: '800', marginTop: '8px', color: '#0f172a' }}>{p.name}</h2>
                <div style={{ fontSize: '26px', fontWeight: '900', color: '#2563eb', margin: '8px 0 16px' }}>{p.price}</div>

                <div style={{ borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)', padding: '12px 0', fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Operator Staff Limit:</span>
                    <strong style={{ color: '#0f172a' }}>{p.limitUsers}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Technician Seats:</span>
                    <strong style={{ color: '#0f172a' }}>{p.limitTechs}</strong>
                  </div>
                </div>

                <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {p.features.map((f, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#475569' }}>
                      <Check size={14} style={{ color: '#059669', flexShrink: 0 }} />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="button"
                className={isPopular ? 'btn btn-primary' : 'btn btn-secondary'}
                style={{ width: '100%', justifyContent: 'center', marginTop: '24px' }}
                onClick={() => toast.info(`Editing plan limits for ${p.name}`)}
              >
                <Edit3 size={14} /> Modify Plan Limits
              </button>
            </div>
          );
        })}
      </div>
    </AdminLayout>
  );
};
