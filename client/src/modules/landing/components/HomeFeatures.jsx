import React from 'react';
import {
  Wrench,
  Receipt,
  Package,
  Smartphone,
  MessageCircle,
  BarChart3,
  Shield,
  Zap,
  CheckCircle2,
  ScanBarcode,
  Layers,
  ArrowUpRight,
  TrendingUp,
  Cpu,
  Store,
  Clock
} from 'lucide-react';

const FEATURES = [
  {
    id: 'intake',
    icon: <Smartphone size={24} />,
    color: 'blue',
    title: 'Smart Device Intake & Digital Job Cards',
    description:
      'Log walk-in repairs in under 30 seconds. Capture IMEI, customer signatures, pattern locks, and pre-existing cosmetic condition checklist.',
    highlights: ['IMEI / Serial Lookup', 'Visual Damage Inspection Map', 'Instant Intake Job Slip'],
  },
  {
    id: 'bench',
    icon: <Zap size={24} />,
    color: 'amber',
    title: 'Kanban Repair Bench & Technician Dispatch',
    description:
      'Keep your technicians synchronized with real-time drag-and-drop ticket boards. Track diagnosis, parts waiting, bench repair, and final QC.',
    highlights: ['Technician Bench Queues', 'Urgent Priority Tagging', 'Turnaround SLA Timers'],
  },
  {
    id: 'pos',
    icon: <Receipt size={24} />,
    color: 'emerald',
    title: 'Instant POS Billing & Thermal Receipts',
    description:
      'Fast counter billing combining parts and bench labor. Compatible with standard 2-inch, 3-inch thermal printers, ESC/POS, and A4 GST/VAT formats.',
    highlights: ['Barcode Scanner Ready', 'Split Payments (UPI/Cash/Card)', 'WhatsApp Digital Invoices'],
  },
  {
    id: 'inventory',
    icon: <Package size={24} />,
    color: 'purple',
    title: 'Parts & Spare Inventory Engine',
    description:
      'Real-time inventory deduction when a repair is closed. Automatic low-stock warnings, supplier purchase orders, and cost vs retail pricing.',
    highlights: ['Auto Stock Deduct on Repair', 'Low-Stock Reorder Triggers', 'Supplier Procurement Ledger'],
  },
  {
    id: 'used-devices',
    icon: <RefreshCwIcon size={24} />,
    color: 'indigo',
    title: 'Refurbished & Used Mobile Marketplace',
    description:
      'Comprehensive trade-in and buy-back valuation engine. Grade pre-owned devices (A+, A, B), calculate profit margins, and generate warranty certificates.',
    highlights: ['IMEI Grade Checklist', 'Buy-back Purchase Agreements', 'Refurb Margin Calculator'],
  },
  {
    id: 'crm',
    icon: <MessageCircle size={24} />,
    color: 'teal',
    title: 'Automated WhatsApp & Customer CRM',
    description:
      'Notify customers instantly when their device moves to diagnostics, parts arrived, or ready for pickup. Complete customer lifetime service history.',
    highlights: ['Zero-Click WhatsApp Alerts', 'Customer Repair History', 'Automated Review Requests'],
  },
  {
    id: 'analytics',
    icon: <BarChart3 size={24} />,
    color: 'rose',
    title: 'Financial Pulse & Workshop Analytics',
    description:
      'Gain full visibility into daily gross revenue, parts profit margins, labor earnings, technician efficiency, and daily cash drawer reconciliation.',
    highlights: ['Net Profit per Repair Job', 'Technician Speed Benchmarks', 'Cash Drawer Settlement'],
  },
  {
    id: 'enterprise',
    icon: <Store size={24} />,
    color: 'cyan',
    title: 'Multi-Branch & Role-Based Permissions',
    description:
      'Scale from one bench to 50 franchise locations. Granular access permissions for bench technicians, counter cashiers, and shop owners.',
    highlights: ['Multi-Branch Support', 'Role-Based Access Control', 'Super Admin Master Console'],
  },
];

function RefreshCwIcon({ size }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
      <path d="M8 16H3v5" />
    </svg>
  );
}

export const HomeFeatures = () => {
  return (
    <section id="features" className="home-features-section">
      <div className="home-container">
        {/* Section Header */}
        <div className="home-section-header text-center">
          <div className="section-eyebrow">
            <Zap size={14} />
            <span>Complete Workshop Capabilities</span>
          </div>
          <h2 className="section-title">
            Engineered Specifically for <span className="gradient-text">Electronics Repair Operations</span>
          </h2>
          <p className="section-description">
            Generic retail POS systems fail in repair shops. Zapate Service Manager gives you every specialized tool required to
            run your repair bench, parts inventory, and front-desk billing with zero friction.
          </p>
        </div>

        {/* Features Grid */}
        <div className="home-features-grid">
          {FEATURES.map((feat) => (
            <div key={feat.id} className={`feature-card feature-accent-${feat.color}`}>
              <div className="feature-icon-wrapper">
                {feat.icon}
              </div>

              <h3 className="feature-card-title">{feat.title}</h3>
              <p className="feature-card-desc">{feat.description}</p>

              <div className="feature-card-highlights">
                {feat.highlights.map((item, idx) => (
                  <div key={idx} className="feature-highlight-item">
                    <CheckCircle2 size={14} className="text-emerald-500" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
