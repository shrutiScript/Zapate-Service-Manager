import React, { useEffect } from 'react';
import { Link } from 'wouter';
import {
  Wrench,
  ShieldCheck,
  Zap,
  CheckCircle2,
  Users,
  Target,
  Award,
  Sparkles,
  ArrowRight,
  Clock,
  Compass,
  Check,
  Printer,
  Package,
  Globe,
  Headphones,
  Cpu,
  Layers,
  HeartHandshake
} from 'lucide-react';
import { HomeNavbar } from '../components/HomeNavbar.jsx';

const STATS = [
  { val: '1,200+', label: 'Workshops Powered' },
  { val: '500,000+', label: 'Thermal Receipts Printed' },
  { val: '99.99%', label: 'Cloud Uptime SLA' },
  { val: '15+', label: 'Countries Worldwide' },
];

const VALUES = [
  {
    icon: <Wrench size={22} />,
    title: 'Technician-First UX',
    color: 'blue',
    desc: 'Built alongside real bench technicians. Intake a device in 30 seconds, lookup parts instantly, and print thermal receipts with 1 click.',
  },
  {
    icon: <Zap size={22} />,
    color: 'amber',
    title: 'Speed & Low Latency',
    desc: 'No bloated screens or slow loading spinners. Lightning-fast search across thousands of spare parts and customer phone records.',
  },
  {
    icon: <ShieldCheck size={22} />,
    color: 'emerald',
    title: 'Enterprise Data Security',
    desc: 'Your customer contact directory, job repair history, and workshop financials are isolated, encrypted, and backed up in real time.',
  },
  {
    icon: <Award size={22} />,
    color: 'purple',
    title: 'Universal Hardware Fit',
    desc: 'Native support for 58mm & 80mm ESC/POS thermal receipt printers, USB barcode scanners, tablets, mobile phones, and desktop PCs.',
  },
];

const PILLARS = [
  {
    icon: <Printer size={20} />,
    title: 'Instant POS Thermal Billing',
    desc: 'Print professional customer invoice slips on standard thermal paper with customizable workshop logo, tax breakdown, and UPI QR codes.',
  },
  {
    icon: <Package size={20} />,
    title: 'Smart Parts Stock Engine',
    desc: 'Track screens, batteries, charging ICs, and accessories. Auto-deduct inventory as repairs complete and get low-stock warnings.',
  },
  {
    icon: <Cpu size={20} />,
    title: 'Multi-Bench & Multi-Store',
    desc: 'Scale from a single technician counter to multi-bench service centers and franchise chains with centralized inventory controls.',
  },
  {
    icon: <HeartHandshake size={20} />,
    title: 'Customer Trust & Warranties',
    desc: 'Maintain transparent repair logs, digital warranty verification, and customer visit history to build long-term repeat business.',
  },
];

const MILESTONES = [
  {
    year: '2022',
    title: 'The Prototype',
    desc: 'Created our initial digital repair job board for 5 local mobile repair workshops in need of replacing handwritten paper ticket notebooks.',
  },
  {
    year: '2023',
    title: 'POS & Thermal Printer Integration',
    desc: 'Launched instant 58mm/80mm thermal receipt printing, barcode label sticker generation, and live inventory auto-deductions.',
  },
  {
    year: '2024',
    title: 'Multi-Branch & Role Permissions',
    desc: 'Added support for multi-location workshops, custom technician access levels, and automated daily cash drawer reconciliations.',
  },
  {
    year: '2025',
    title: 'Real-Time Automation Engine',
    desc: 'Expanded with customer SMS notifications, refurbished device inventory tracking, and deep financial analytics.',
  },
  {
    year: '2026',
    title: 'Over 1,200+ Workshops Worldwide',
    desc: 'Now trusted by independent technicians, electronics service centers, and franchise chains across more than 15 countries.',
  },
];

export const AboutPage = () => {
  useEffect(() => {
    document.title = 'About Us — Zapate Service Manager';
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  return (
    <div className="dark-landing-page">
      <HomeNavbar />

      <main>
        {/* Dark Hero Section */}
        <section className="dark-hero-section motion-hero-container">
          <div className="dark-grid-pattern" />
          <div className="motion-ambient-glow dark-glow-1" />
          <div className="motion-ambient-glow dark-glow-2" />

          <div className="simple-container text-center hero-content-wrapper">
            <div className="dark-hero-badge motion-badge-pulse">
              <Sparkles size={14} className="text-cyan" />
              <span>Our Story, Mission & Culture</span>
            </div>

            <h1 className="dark-hero-title">
              Empowering Repair Workshops <br />
              <span className="dark-title-gradient">Across the Globe</span>
            </h1>

            <p className="dark-hero-subtitle">
              We started Zapate Service Manager to replace messy paper notebooks and lost counter receipts with a fast,
              clean, and modern cloud platform that any technician can master in minutes.
            </p>

            {/* Quick Metrics Bar */}
            <div className="dark-metrics-strip" style={{ marginTop: '20px' }}>
              {STATS.map((st, sIdx) => (
                <React.Fragment key={sIdx}>
                  <div className="metric-box">
                    <div className="metric-val font-mono">{st.val}</div>
                    <div className="metric-lbl">{st.label}</div>
                  </div>
                  {sIdx < STATS.length - 1 && <div className="metric-sep" />}
                </React.Fragment>
              ))}
            </div>
          </div>
        </section>

        {/* Origin Story Narrative Section */}
        <section className="dark-features-section">
          <div className="simple-container">
            <div className="dark-story-container">
              <div className="dark-story-content">
                <span className="dark-tag">Born On The Workbench</span>
                <h2>Why We Built Zapate Service Manager</h2>
                <p>
                  Every technician knows the frustration: handwriting job numbers on paper slips, misplacing customer contact info,
                  running out of iPhone displays mid-repair, and spending 10 minutes settling counter receipts at the end of a long day.
                </p>
                <p>
                  We spent months working alongside real repair shop owners and bench technicians to engineer software that feels like a natural extension of your tools.
                  No complicated enterprise bloat, no confusing accounting menus—just blazing speed, accurate spare parts tracking, and instant 1-click thermal receipts.
                </p>

                <div className="story-highlights-list">
                  <div className="story-highlight-item">
                    <CheckCircle2 size={16} className="text-emerald" />
                    <span>Engineered for bench speed & counter efficiency</span>
                  </div>
                  <div className="story-highlight-item">
                    <CheckCircle2 size={16} className="text-emerald" />
                    <span>Built-in GST & tax compliant thermal receipts</span>
                  </div>
                  <div className="story-highlight-item">
                    <CheckCircle2 size={16} className="text-emerald" />
                    <span>Instant spare parts lookup & auto-deduction</span>
                  </div>
                </div>
              </div>

              <div className="dark-story-card">
                <div className="story-badge">
                  <Wrench size={16} />
                  <span>The Zapate Service Manager Promise</span>
                </div>
                <h3>Simple. Reliable. Fast.</h3>
                <p>
                  "Our goal is simple: give every repair shop owner the same powerful digital tools used by massive service centers, without the enterprise complexity or price tag."
                </p>
                <div className="story-author">
                  <strong>The Zapate Service Manager Team</strong>
                  <span>Dedicated to Workshop Excellence</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Core Workshop Pillars */}
        <section className="dark-steps-section">
          <div className="simple-container">
            <div className="dark-section-header text-center">
              <span className="dark-tag">What We Deliver</span>
              <h2>Four Pillars of the Platform</h2>
              <p>Designed specifically to streamline everyday operations for electronics & mobile technicians.</p>
            </div>

            <div className="dark-pillars-grid">
              {PILLARS.map((pil, idx) => (
                <div key={idx} className="dark-pillar-card">
                  <div className="dark-pillar-icon">{pil.icon}</div>
                  <h4>{pil.title}</h4>
                  <p>{pil.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Core Principles & Values */}
        <section className="dark-features-section">
          <div className="simple-container">
            <div className="dark-section-header text-center">
              <span className="dark-tag">Our Values</span>
              <h2>Built On Uncompromising Principles</h2>
              <p>Everything we design is focused on saving technician time and eliminating billing errors.</p>
            </div>

            <div className="dark-values-grid">
              {VALUES.map((val, idx) => (
                <div key={idx} className="dark-value-card">
                  <div className={`dark-value-icon bg-${val.color}-dark`}>{val.icon}</div>
                  <h4>{val.title}</h4>
                  <p>{val.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Growth Milestones Timeline */}
        <section className="dark-steps-section">
          <div className="simple-container">
            <div className="dark-section-header text-center">
              <span className="dark-tag">Company Milestones</span>
              <h2>Our Journey & Growth</h2>
              <p>From a small 5-workshop prototype to a platform trusted across 15+ countries.</p>
            </div>

            <div className="dark-timeline-list">
              {MILESTONES.map((item, idx) => (
                <div key={idx} className="dark-timeline-item">
                  <div className="dark-timeline-year font-mono">{item.year}</div>
                  <div className="dark-timeline-dot" />
                  <div className="dark-timeline-content">
                    <h4>{item.title}</h4>
                    <p>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Proper Dark SaaS Footer */}
      <footer className="dark-footer">
        <div className="simple-container">
          <div className="dark-footer-main">
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

export default AboutPage;
