import React from 'react';
import { Link } from 'wouter';
import {
  Wrench,
  ShieldCheck,
  CheckCircle2,
  Smartphone,
  Zap,
  Printer,
  Package,
  ArrowLeft,
  Sparkles,
  Star
} from 'lucide-react';

export const AuthLayout = ({ children }) => {
  return (
    <div className="auth-root-container">
      {/* Left Branding Hero Pane */}
      <div className="auth-hero-pane">
        {/* Ambient Motion Graphic Glows */}
        <div className="auth-ambient-glow auth-glow-1" />
        <div className="auth-ambient-glow auth-glow-2" />
        <div className="auth-grid-overlay" />

        <div className="auth-hero-inner">
          {/* Header Brand Link */}
          <div className="auth-hero-top">
            <Link href="/" className="auth-hero-logo">
              <div className="auth-logo-icon">
                <Wrench size={22} />
              </div>
              <div className="auth-logo-text">
                <span>Zapate</span> Service Manager
              </div>
            </Link>

            <Link href="/" className="auth-back-btn">
              <ArrowLeft size={15} />
              <span>Back to Home</span>
            </Link>
          </div>

          {/* Hero Main Content */}
          <div className="auth-hero-main">
            <div className="auth-hero-badge">
              <Sparkles size={14} className="text-cyan" />
              <span>Workshop Management OS</span>
            </div>

            <h1 className="auth-hero-title">
              Powering Modern <br />
              <span className="auth-title-gradient">Repair Centers</span>
            </h1>

            <p className="auth-hero-desc">
              All-in-one platform for mobile, laptop, and electronics repair shops. Fast POS thermal billing,
              real-time spare parts stock sync, and lifetime customer service tracking.
            </p>

            {/* Feature Pills */}
            <div className="auth-features-list">
              <div className="auth-feature-item">
                <div className="feature-item-icon">
                  <Printer size={16} />
                </div>
                <div>
                  <strong>Instant POS Thermal Receipts</strong>
                  <span>Fast 58mm/80mm print with GST & UPI QR</span>
                </div>
              </div>

              <div className="auth-feature-item">
                <div className="feature-item-icon">
                  <Package size={16} />
                </div>
                <div>
                  <strong>Live Spare Parts Stock Engine</strong>
                  <span>Auto-deduct screens, batteries & ICs</span>
                </div>
              </div>

              <div className="auth-feature-item">
                <div className="feature-item-icon">
                  <ShieldCheck size={16} />
                </div>
                <div>
                  <strong>Customer & Warranty Directory</strong>
                  <span>Instant lookup by mobile number or serial</span>
                </div>
              </div>
            </div>

            {/* Trust Testimonial Card */}
            <div className="auth-trust-card">
              <div className="trust-stars">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={15} fill="#f59e0b" color="#f59e0b" />
                ))}
                <span className="trust-score">5.0 / 5.0 Rating</span>
              </div>
              <p className="trust-quote">
                "Zapate Service Manager cut our counter invoice time in half and stopped parts stock leaks across our 3 branches."
              </p>
              <div className="trust-author">
                <span>Trusted by 1,200+ repair shops worldwide</span>
              </div>
            </div>
          </div>

          {/* Footer Info */}
          <div className="auth-hero-footer">
            <span>© {new Date().getFullYear()} Zapate Service Manager. 256-Bit SSL Encrypted.</span>
          </div>
        </div>
      </div>

      {/* Right Form Pane */}
      <div className="auth-form-pane">
        <div className="auth-form-wrapper">
          {children}
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
