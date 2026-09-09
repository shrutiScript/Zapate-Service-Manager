import React, { useState } from 'react';
import {
  Store,
  Wrench,
  Receipt,
  Layers,
  CheckCircle2,
  TrendingUp,
  Shield,
  Smartphone,
  Cpu,
  BarChart,
  Users
} from 'lucide-react';

const ROLES = [
  {
    id: 'owner',
    label: 'Workshop Owners',
    icon: <Store size={18} />,
    title: 'Total Business Clarity & Zero Profit Leakage',
    subtitle: 'Step away from the daily chaos and run your repair business with executive confidence.',
    benefits: [
      'Real-time gross profit and net margin tracking per repair and per technician',
      'Eliminate spare parts theft with automated inventory count audits',
      'Daily end-of-shift cash drawer balance and UPI settlement reconciliation',
      'Automated customer retention reminders for repeat visits and screen protector warranties',
    ],
    badge: 'Executive Command',
    stat: '98.4%',
    statLabel: 'Stock Audit Accuracy',
  },
  {
    id: 'tech',
    label: 'Bench Technicians',
    icon: <Wrench size={18} />,
    title: 'Clean Queues & Fast Parts Lookup',
    subtitle: 'Focus 100% on precision hardware repair without dealing with paper tickets or lost notes.',
    benefits: [
      'Personal Kanban workbench queue showing assigned jobs in priority order',
      'One-click parts allocation directly from the workshop stock room',
      'Built-in 24-point Quality Assurance checklist (FaceID, TrueTone, Touch, Battery)',
      'Digital diagnostic notes & photos stored permanently against the device IMEI',
    ],
    badge: 'Technician Superpower',
    stat: '2.1 hrs',
    statLabel: 'Avg Turnaround Time',
  },
  {
    id: 'frontdesk',
    label: 'Front-Desk & Billing',
    icon: <Receipt size={18} />,
    title: 'Lightning-Fast Intakes & Instant Checkout',
    subtitle: 'Delight walk-in customers with professional digital slips and thermal receipts.',
    benefits: [
      '30-second customer intake with visual physical damage inspection & unlock pattern recording',
      'Fast counter POS with barcode scanning and auto GST/VAT calculations',
      'Split payment methods: Cash, UPI, Card, or Pay Later with balance ledger',
      'Automated WhatsApp notifications whenever device status changes',
    ],
    badge: 'Counter Velocity',
    stat: '45 sec',
    statLabel: 'Check-in Speed',
  },
  {
    id: 'franchise',
    label: 'Franchise & Enterprise',
    icon: <Layers size={18} />,
    title: 'Multi-Location Scalability & Centralized Control',
    subtitle: 'Manage 5 to 50 repair branches from a single unified Super Admin platform.',
    benefits: [
      'Centralized reporting across all branch workshops in real-time',
      'Inter-branch spare parts transfer and stock pooling',
      'Granular role-based permissions (Cashier vs Bench Tech vs Store Manager)',
      'Custom branding, custom thermal receipt templates, and enterprise API access',
    ],
    badge: 'Franchise Scale',
    stat: '50+ Branches',
    statLabel: 'Centralized Control',
  },
];

export const HomeRoleShowcase = () => {
  const [activeRoleId, setActiveRoleId] = useState('owner');
  const activeRole = ROLES.find((r) => r.id === activeRoleId) || ROLES[0];

  return (
    <section className="home-role-showcase-section">
      <div className="home-container">
        {/* Header */}
        <div className="home-section-header text-center">
          <div className="section-eyebrow">
            <Users size={14} />
            <span>Built For Every Team Member</span>
          </div>
          <h2 className="section-title">
            Tailored Experiences For <span className="gradient-text">Your Entire Operation</span>
          </h2>
          <p className="section-description">
            Whether you are on the repair bench, managing front counter billing, or reviewing multi-store balance sheets,
            Zapate Service Manager adapts to your exact role.
          </p>
        </div>

        {/* Role Switcher Tabs */}
        <div className="role-tabs-container">
          {ROLES.map((role) => (
            <button
              key={role.id}
              type="button"
              className={`role-tab-btn ${activeRoleId === role.id ? 'active' : ''}`}
              onClick={() => setActiveRoleId(role.id)}
            >
              {role.icon}
              <span>{role.label}</span>
            </button>
          ))}
        </div>

        {/* Active Role Content Card */}
        <div className="role-content-card">
          <div className="role-content-text">
            <div className="role-badge-tag">{activeRole.badge}</div>
            <h3 className="role-card-title">{activeRole.title}</h3>
            <p className="role-card-subtitle">{activeRole.subtitle}</p>

            <div className="role-benefits-list">
              {activeRole.benefits.map((b, idx) => (
                <div key={idx} className="role-benefit-item">
                  <CheckCircle2 size={16} className="text-emerald-500 flex-shrink-0" />
                  <span>{b}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="role-content-stat-pane">
            <div className="role-stat-circle">
              <div className="stat-big-num font-mono">{activeRole.stat}</div>
              <div className="stat-big-lbl">{activeRole.statLabel}</div>
            </div>
            <div className="role-stat-footer">
              <span>Optimized for maximum workshop throughput</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
