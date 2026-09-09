import React, { useState } from 'react';
import { Link } from 'wouter';
import {
  Check,
  Zap,
  Sparkles,
  ShieldCheck,
  Store,
  Layers,
  ArrowRight,
  HelpCircle
} from 'lucide-react';

const PLANS = [
  {
    id: 'starter',
    name: 'Starter Workbench',
    badge: 'Single Tech / Boutique',
    monthlyPrice: 999,
    annualPrice: 799,
    description: 'Perfect for independent repair specialists and single-counter mobile service shops.',
    features: [
      '1 Workshop Location',
      'Up to 2 User Seats (Owner + Tech)',
      'Up to 150 Repair Jobs / month',
      'Digital Job Intake & Barcode Printing',
      'Express POS Billing & Thermal Receipts',
      'Parts Inventory Shelf Tracking',
      'Customer Directory & History',
      'Standard Email & Community Support',
    ],
    popular: false,
    cta: 'Start Free Starter Trial',
  },
  {
    id: 'pro',
    name: 'Pro Workshop OS',
    badge: 'Most Popular for Busy Centers',
    monthlyPrice: 2499,
    annualPrice: 1999,
    description: 'The complete powerhouse for multi-technician repair centers and high-volume operations.',
    features: [
      'Up to 2 Workshop Locations',
      'Up to 8 User Seats (Cashiers + Master Techs)',
      'Unlimited Repair Jobs & POS Invoices',
      'Kanban Repair Board & Status Timers',
      'Smart Parts Inventory & Low-Stock Alerts',
      'Automated WhatsApp & SMS Notifications',
      'Refurbished & Used Mobile Hub',
      'Financial Profit Pulse & Cash Drawer Reports',
      'Priority 24/7 WhatsApp & Phone Support',
    ],
    popular: true,
    cta: 'Start 14-Day Free Pro Trial',
  },
  {
    id: 'enterprise',
    name: 'Franchise Enterprise',
    badge: 'Multi-Location Chains',
    monthlyPrice: 5999,
    annualPrice: 4799,
    description: 'Built for repair chains, authorized franchise networks, and enterprise service centers.',
    features: [
      'Unlimited Workshop Locations',
      'Unlimited User Seats & Granular Roles',
      'Centralized Franchise Intelligence Dashboard',
      'Inter-Branch Inventory Transfers & Stock Pooling',
      'Custom Branded Thermal Receipt Layouts',
      'Dedicated Migration Manager & Staff Training',
      'Custom ERP/Accounting Webhooks & REST API',
      'Enterprise 99.99% SLA & Dedicated Account Manager',
    ],
    popular: false,
    cta: 'Deploy Enterprise Suite',
  },
];

export const HomePricing = () => {
  const [billingCycle, setBillingCycle] = useState('annual'); // 'monthly' or 'annual'

  return (
    <section id="pricing" className="home-pricing-section">
      <div className="home-container">
        {/* Section Header */}
        <div className="home-section-header text-center">
          <div className="section-eyebrow">
            <Sparkles size={14} />
            <span>Transparent, Scalable Pricing</span>
          </div>
          <h2 className="section-title">
            Simple Plans That <span className="gradient-text">Pay For Themselves</span>
          </h2>
          <p className="section-description">
            No surprise add-ons. Every plan includes core workshop tools, thermal printing, and free automatic updates.
          </p>

          {/* Billing Switcher */}
          <div className="pricing-toggle-container">
            <span className={`toggle-label ${billingCycle === 'monthly' ? 'active' : ''}`}>
              Monthly Billing
            </span>
            <button
              type="button"
              className={`pricing-toggle-switch ${billingCycle === 'annual' ? 'switched' : ''}`}
              onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'annual' : 'monthly')}
              aria-label="Toggle annual or monthly billing"
            >
              <span className="toggle-thumb" />
            </button>
            <span className={`toggle-label ${billingCycle === 'annual' ? 'active' : ''}`}>
              Annual Billing
              <span className="save-badge">Save 20% (2 Months Free)</span>
            </span>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="pricing-cards-grid">
          {PLANS.map((plan) => {
            const price = billingCycle === 'annual' ? plan.annualPrice : plan.monthlyPrice;

            return (
              <div
                key={plan.id}
                className={`pricing-card ${plan.popular ? 'pricing-card-popular' : ''}`}
              >
                {plan.popular && (
                  <div className="popular-ribbon">
                    <Zap size={13} />
                    <span>RECOMMENDED BY 80% OF WORKSHOPS</span>
                  </div>
                )}

                <div className="pricing-card-header">
                  <span className="plan-badge-pill">{plan.badge}</span>
                  <h3 className="plan-name">{plan.name}</h3>
                  <p className="plan-desc">{plan.description}</p>
                </div>

                <div className="pricing-price-box">
                  <div className="price-row">
                    <span className="currency font-mono">₹</span>
                    <span className="amount font-mono">{price.toLocaleString('en-IN')}</span>
                    <span className="period">/ month</span>
                  </div>
                  <span className="billing-subtext">
                    {billingCycle === 'annual' ? 'Billed annually (tax inclusive)' : 'Billed monthly'}
                  </span>
                </div>

                <Link
                  href={`/register?plan=${plan.id}`}
                  className={`btn btn-full ${
                    plan.popular ? 'btn-primary btn-lg' : 'btn-outline'
                  } pricing-cta-btn`}
                >
                  <span>{plan.cta}</span>
                  <ArrowRight size={16} />
                </Link>

                <div className="pricing-features-divider" />

                <div className="pricing-features-list">
                  <span className="features-list-title">Everything included:</span>
                  {plan.features.map((feat, idx) => (
                    <div key={idx} className="plan-feature-item">
                      <Check size={16} className="text-emerald-500 flex-shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Guarantee Banner */}
        <div className="pricing-guarantee-box">
          <ShieldCheck size={28} className="text-blue-500 flex-shrink-0" />
          <div>
            <h4>14-Day Free Trial • Zero Risk Guarantee</h4>
            <p>
              Test Zapate Service Manager in your live shop for 14 days. If it doesn't noticeably accelerate your repairs and billing,
              cancel anytime with one click.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
