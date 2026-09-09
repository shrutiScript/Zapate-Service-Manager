import React, { useEffect, useState } from 'react';
import { Link } from 'wouter';
import {
  Receipt,
  Package,
  ArrowRight,
  CheckCircle2,
  Zap,
  ShieldCheck,
  Printer,
  Sparkles,
  Check,
  Wrench,
  Activity,
  Globe,
  Mail,
  Headphones,
  Lock,
  Layers,
  Smartphone,
  CreditCard,
  FileText
} from 'lucide-react';
import { HomeNavbar } from '../components/HomeNavbar.jsx';

export const HomePage = () => {
  useEffect(() => {
    document.title = 'Zapate Service Manager — Smart Repair Shop Management & POS';
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  const [billingCycle, setBillingCycle] = useState('annual'); // 'monthly' | 'annual'

  const plans = [
    {
      id: 'starter',
      name: 'Starter Shop',
      badge: 'Single Tech & Counter',
      priceMonthly: 999,
      priceAnnual: 799,
      desc: 'Great for independent technicians and single-counter repair shops.',
      features: [
        '1 Workshop Location',
        'Up to 2 Staff Accounts',
        'Unlimited Invoices & Receipts',
        'Parts Inventory Management',
        'Standard Thermal Printing (58mm/80mm)',
        'Basic Customer History',
      ],
      popular: false,
      btnText: 'Start Free Trial',
    },
    {
      id: 'pro',
      name: 'Pro Workshop',
      badge: 'Most Popular',
      priceMonthly: 2499,
      priceAnnual: 1999,
      desc: 'The complete toolkit for busy repair shops and multi-bench teams.',
      features: [
        'Up to 2 Workshop Locations',
        'Up to 8 Staff & Technician Accounts',
        'Unlimited Invoices & Receipts',
        'Smart Parts Inventory & Low-Stock Alerts',
        'Automatic WhatsApp & SMS Notifications',
        'GST & VAT Tax Reports',
        'Priority 24/7 Support',
      ],
      popular: true,
      btnText: 'Start 14-Day Free Trial',
    },
    {
      id: 'enterprise',
      name: 'Franchise Enterprise',
      badge: 'Multi-Location Chains',
      priceMonthly: 5999,
      priceAnnual: 4799,
      desc: 'Built for service franchises and multi-branch electronics chains.',
      features: [
        'Unlimited Workshop Locations',
        'Unlimited Staff & Granular Roles',
        'Centralized Multi-Branch Inventory',
        'Custom Branded Thermal Receipts',
        'Dedicated Account Manager',
        'Custom Data Migration & API Access',
      ],
      popular: false,
      btnText: 'Contact Enterprise',
    },
  ];

  return (
    <div className="dark-landing-page">
      {/* Proper Header */}
      <HomeNavbar />

      <main>
        {/* Sleek Motion Graphic Hero Section */}
        <section className="dark-hero-section motion-hero-container">
          {/* Animated Cyber Grid Overlay */}
          <div className="dark-grid-pattern" />

          {/* Glowing Ambient Light Orbs */}
          <div className="motion-ambient-glow dark-glow-1" />
          <div className="motion-ambient-glow dark-glow-2" />
          <div className="motion-ambient-glow dark-glow-3" />

          <div className="simple-container text-center hero-content-wrapper">
            {/* Top Badge */}
            <div className="dark-hero-badge motion-badge-pulse">
              <Sparkles size={14} className="text-cyan" />
              <span>Next-Gen Repair Shop Platform</span>
            </div>

            {/* Main Headline */}
            <h1 className="dark-hero-title">
              Manage Your Repair Shop <br />
              <span className="dark-title-gradient">Easily, Fast & Efficiently</span>
            </h1>

            {/* Subheadline */}
            <p className="dark-hero-subtitle">
              The all-in-one software for mobile, laptop, and electronics repair shops.
              Track spare parts inventory, print instant POS thermal receipts, and streamline daily counter billing.
            </p>

            {/* Hero CTA Actions */}
            <div className="dark-hero-actions">
              <Link href="/register" className="dark-btn dark-btn-primary dark-btn-lg motion-btn-hover">
                <span>Start 14-Day Free Trial</span>
                <ArrowRight size={18} />
              </Link>
              <Link href="/login" className="dark-btn dark-btn-outline dark-btn-lg">
                <ShieldCheck size={18} />
                <span>Live Interactive Demo</span>
              </Link>
            </div>

            {/* Trust Points */}
            <div className="dark-hero-badges-row">
              <div className="badge-item">
                <CheckCircle2 size={15} className="text-emerald" />
                <span>No credit card required</span>
              </div>
              <div className="badge-item">
                <CheckCircle2 size={15} className="text-emerald" />
                <span>60-Second Setup</span>
              </div>
              <div className="badge-item">
                <CheckCircle2 size={15} className="text-emerald" />
                <span>Supports PC, Tablet & Mobile</span>
              </div>
            </div>

            {/* Highlighted Metric Highlights Bar */}
            <div className="dark-metrics-strip">
              <div className="metric-box">
                <div className="metric-val font-mono">1-Click</div>
                <div className="metric-lbl">Thermal POS Invoicing</div>
              </div>
              <div className="metric-sep" />
              <div className="metric-box">
                <div className="metric-val font-mono">100%</div>
                <div className="metric-lbl">Realtime Inventory Sync</div>
              </div>
              <div className="metric-sep" />
              <div className="metric-box">
                <div className="metric-val font-mono">58/80mm</div>
                <div className="metric-lbl">Printer Compatible</div>
              </div>
              <div className="metric-sep" />
              <div className="metric-box">
                <div className="metric-val font-mono">99.99%</div>
                <div className="metric-lbl">Cloud Data Reliability</div>
              </div>
            </div>
          </div>
        </section>

        {/* 3 Core Features (Dark Glass Cards) */}
        <section id="features" className="dark-features-section">
          <div className="simple-container">
            <div className="dark-section-header text-center">
              <span className="dark-tag">Core Features</span>
              <h2>Everything You Need, Nothing You Don't</h2>
              <p>Tailored specifically for electronics, mobile, and computer repair workshops.</p>
            </div>

            <div className="dark-features-grid">
              {/* Feature 1 */}
              <div className="dark-feature-card motion-feature-card">
                <div className="dark-feature-icon bg-emerald-dark">
                  <Package size={24} />
                </div>
                <h3>1. Spare Parts & Stock Control</h3>
                <p>
                  Maintain accurate counts of screens, batteries, motherboard ICs, and accessories.
                  Get instant alerts for low-stock parts and auto-deduct items on service completion.
                </p>
                <ul className="dark-feature-list">
                  <li><CheckCircle2 size={15} /> Real-time stock counts</li>
                  <li><CheckCircle2 size={15} /> Low stock & replenishment alerts</li>
                  <li><CheckCircle2 size={15} /> Profit margins & cost analytics</li>
                </ul>
              </div>

              {/* Feature 2 */}
              <div className="dark-feature-card motion-feature-card">
                <div className="dark-feature-icon bg-purple-dark">
                  <Receipt size={24} />
                </div>
                <h3>2. Fast POS & Thermal Invoicing</h3>
                <p>
                  Generate lightning-fast thermal receipts (58mm/80mm) and A4 GST bills.
                  Accept cash, UPI, cards, and generate daily counter settlement reports seamlessly.
                </p>
                <ul className="dark-feature-list">
                  <li><CheckCircle2 size={15} /> Thermal printer & barcode compatible</li>
                  <li><CheckCircle2 size={15} /> Instant GST & Tax calculations</li>
                  <li><CheckCircle2 size={15} /> Daily cash drawer settlement</li>
                </ul>
              </div>

              {/* Feature 3 */}
              <div className="dark-feature-card motion-feature-card">
                <div className="dark-feature-icon bg-blue-dark">
                  <Zap size={24} />
                </div>
                <h3>3. Customer & Service Records</h3>
                <p>
                  Search past repair records by phone number or device serial in seconds.
                  Keep customer trust high with clear digital warranty tracking and repair history.
                </p>
                <ul className="dark-feature-list">
                  <li><CheckCircle2 size={15} /> Instant phone number directory search</li>
                  <li><CheckCircle2 size={15} /> Lifetime device service history</li>
                  <li><CheckCircle2 size={15} /> Digital warranty lookup</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* 3 Simple Operational Steps */}
        <section id="how-it-works" className="dark-steps-section">
          <div className="simple-container">
            <div className="dark-section-header text-center">
              <span className="dark-tag">How It Works</span>
              <h2>3 Simple Steps to Run Your Workshop</h2>
              <p>No steep learning curves or complicated training. Get started in minutes.</p>
            </div>

            <div className="dark-steps-grid">
              <div className="dark-step-card motion-step-card">
                <div className="dark-step-circle">1</div>
                <h4>Intake & Lookup</h4>
                <p>Check in the customer device and check available spare parts in seconds.</p>
              </div>

              <div className="dark-step-arrow">➔</div>

              <div className="dark-step-card motion-step-card">
                <div className="dark-step-circle">2</div>
                <h4>Fix & Auto-Deduct</h4>
                <p>Technician repairs the hardware and parts are automatically deducted from stock.</p>
              </div>

              <div className="dark-step-arrow">➔</div>

              <div className="dark-step-card motion-step-card">
                <div className="dark-step-circle">3</div>
                <h4>Thermal Receipt & Bill</h4>
                <p>Print the thermal invoice, collect payment via UPI/Cash, and deliver the device.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Subscription Plans Section */}
        <section id="plans" className="dark-plans-section">
          <div className="simple-container">
            <div className="dark-section-header text-center">
              <span className="dark-tag">Transparent Pricing</span>
              <h2>Flexible Plans for Every Workshop</h2>
              <p>Choose the right plan for your business size. Upgrade, downgrade, or cancel anytime.</p>

              {/* Monthly / Annual Toggle */}
              <div className="dark-billing-toggle">
                <span className={`dark-toggle-txt ${billingCycle === 'monthly' ? 'active' : ''}`}>
                  Monthly Billing
                </span>
                <button
                  type="button"
                  className={`dark-toggle-pill-btn ${billingCycle === 'annual' ? 'annual-active' : ''}`}
                  onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'annual' : 'monthly')}
                  aria-label="Toggle Annual or Monthly Billing"
                >
                  <span className="dark-toggle-dot" />
                </button>
                <span className={`dark-toggle-txt ${billingCycle === 'annual' ? 'active' : ''}`}>
                  Annual Billing
                  <span className="dark-discount-pill">Save 20%</span>
                </span>
              </div>
            </div>

            {/* 3 Dark Plan Cards */}
            <div className="dark-plans-grid">
              {plans.map((p) => {
                const currentPrice = billingCycle === 'annual' ? p.priceAnnual : p.priceMonthly;

                return (
                  <div
                    key={p.id}
                    className={`dark-plan-card ${p.popular ? 'dark-plan-popular' : ''}`}
                  >
                    {p.popular && (
                      <div className="dark-popular-badge">
                        <Sparkles size={13} />
                        <span>MOST POPULAR</span>
                      </div>
                    )}

                    <div className="dark-plan-header">
                      <span className="dark-plan-type-tag">{p.badge}</span>
                      <h3>{p.name}</h3>
                      <p>{p.desc}</p>
                    </div>

                    <div className="dark-plan-price-area">
                      <div className="dark-price-number">
                        <span className="currency font-mono">₹</span>
                        <span className="amount font-mono">{currentPrice.toLocaleString('en-IN')}</span>
                        <span className="period">/ month</span>
                      </div>
                      <span className="dark-billing-cycle-note">
                        {billingCycle === 'annual' ? 'Billed annually' : 'Billed monthly'}
                      </span>
                    </div>

                    <Link
                      href={`/register?plan=${p.id}`}
                      className={`dark-btn ${p.popular ? 'dark-btn-primary' : 'dark-btn-outline'} dark-btn-full dark-btn-lg`}
                    >
                      <span>{p.btnText}</span>
                      <ArrowRight size={16} />
                    </Link>

                    <div className="dark-plan-features-divider" />

                    <ul className="dark-plan-features-list">
                      {p.features.map((feat, fIdx) => (
                        <li key={fIdx}>
                          <Check size={16} className="text-emerald" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </main>

      {/* Proper, Comprehensive Dark SaaS Footer */}
      <footer className="dark-footer">
        <div className="simple-container">
          {/* Top Footer Grid */}
          <div className="dark-footer-main">
            {/* Column 1: Brand & Status */}
            <div className="dark-footer-col brand-col">
              <div className="dark-logo">
                <div className="dark-logo-icon">
                  <Wrench size={20} />
                </div>
                <div className="dark-logo-text">
                  <span>Repair</span>Flow
                </div>
              </div>
              <p className="footer-bio">
                The smart, modern workshop management system built for electronics, mobile, and laptop repair professionals worldwide.
              </p>
              <div className="system-status-pill">
                <span className="status-indicator-dot" />
                <span className="status-text">All Systems Operational</span>
              </div>
            </div>

            {/* Column 2: Solutions & POS */}
            <div className="dark-footer-col">
              <h4>Solutions & POS</h4>
              <ul className="footer-link-list">
                <li><Link href="/#features">Express POS Billing</Link></li>
                <li><Link href="/#features">Thermal Receipt (58/80mm)</Link></li>
                <li><Link href="/#features">Parts Stock Engine</Link></li>
                <li><Link href="/#features">Multi-Location Support</Link></li>
                <li><Link href="/#features">Daily Cash Settlement</Link></li>
              </ul>
            </div>

            {/* Column 3: Plans & Pricing */}
            <div className="dark-footer-col">
              <h4>Plans & Pricing</h4>
              <ul className="footer-link-list">
                <li><a href="/#plans">Starter Shop (₹799/mo)</a></li>
                <li><a href="/#plans">Pro Workshop (₹1,999/mo)</a></li>
                <li><a href="/#plans">Franchise Enterprise</a></li>
                <li><Link href="/register">Start 14-Day Free Trial</Link></li>
                <li><Link href="/login">Workshop Sign In</Link></li>
              </ul>
            </div>

            {/* Column 4: Company & Support */}
            <div className="dark-footer-col">
              <h4>Company & Support</h4>
              <ul className="footer-link-list">
                <li><Link href="/about">About Us & Story</Link></li>
                <li><Link href="/about">Mission & Values</Link></li>
                <li><a href="mailto:support@zapateservicemanager.com">support@zapateservicemanager.com</a></li>
                <li><span className="footer-phone">Mon - Sat: 9:00 AM - 8:00 PM</span></li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="dark-footer-bottom">
            <p className="copyright-text">
              © {new Date().getFullYear()} Zapate Service Manager. All rights reserved.
            </p>
            <div className="footer-badges-bottom">
              <span className="badge-chip">🔒 256-Bit SSL Encrypted</span>
              <span className="badge-chip">⚡ 99.9% Uptime SLA</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
