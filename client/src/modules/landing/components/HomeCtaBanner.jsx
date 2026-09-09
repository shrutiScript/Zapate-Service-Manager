import React from 'react';
import { Link } from 'wouter';
import { Sparkles, ArrowRight, ShieldCheck, Zap, Wrench } from 'lucide-react';

export const HomeCtaBanner = () => {
  return (
    <section className="home-cta-banner-section">
      <div className="home-container">
        <div className="cta-banner-card">
          <div className="cta-banner-glow-1" />
          <div className="cta-banner-glow-2" />

          <div className="cta-banner-content">
            <div className="cta-banner-badge">
              <Sparkles size={14} className="text-amber-300" />
              <span>Modernize Your Workshop Today</span>
            </div>

            <h2 className="cta-banner-title">
              Ready to Eliminate Bench Chaos & <br />
              Accelerate Your <span className="text-white underline decoration-blue-400">Repair Profits?</span>
            </h2>

            <p className="cta-banner-description">
              Set up your workshop in 60 seconds. Experience automated customer check-ins, real-time parts stock tracking,
              and instant POS thermal invoicing with zero friction.
            </p>

            <div className="cta-banner-actions">
              <Link href="/register" className="btn btn-primary btn-hero-primary btn-lg">
                <span>Start Free 14-Day Trial</span>
                <ArrowRight size={18} />
              </Link>
              <Link href="/login" className="btn btn-outline btn-hero-secondary btn-lg cta-demo-btn">
                <ShieldCheck size={18} />
                <span>Explore Live Demo Console</span>
              </Link>
            </div>

            <div className="cta-banner-footer-notes">
              <span>✓ 14-Day Full Feature Free Trial</span>
              <span>•</span>
              <span>✓ No Credit Card Required</span>
              <span>•</span>
              <span>✓ Thermal & Barcode Hardware Ready</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
