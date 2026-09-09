import React from 'react';
import { Link } from 'wouter';
import {
  Wrench,
  ShieldCheck,
  Heart,
  Globe,
  Mail,
  Phone,
  MapPin,
  ExternalLink,
  Sparkles,
  Zap
} from 'lucide-react';

export const HomeFooter = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="home-footer">
      <div className="home-container">
        {/* Top Footer Grid */}
        <div className="home-footer-grid">
          {/* Brand Col */}
          <div className="footer-brand-col">
            <Link href="/" className="footer-brand-logo">
              <div className="footer-brand-icon">
                <Wrench size={20} />
              </div>
              <div className="footer-brand-text">
                <div className="footer-brand-title">
                  Zapate <span>Service Manager</span>
                </div>
                <span className="footer-brand-tag">ENTERPRISE WORKSHOP OS</span>
              </div>
            </Link>

            <p className="footer-brand-desc">
              The next-generation multi-tenant operating system purpose-built for mobile, computer, and electronics repair
              workshops, high-volume service centers, and franchise chains.
            </p>

            <div className="footer-status-pill">
              <span className="status-dot-pulse" />
              <span>All Systems Operational (99.98% Uptime)</span>
            </div>
          </div>

          {/* Col 1: Platform Modules */}
          <div className="footer-links-col">
            <h4 className="footer-col-title">Platform Suite</h4>
            <ul className="footer-links-list">
              <li>
                <a href="#preview">Repair Bench & Kanban</a>
              </li>
              <li>
                <a href="#preview">Express POS & Thermal Billing</a>
              </li>
              <li>
                <a href="#preview">Parts Inventory Shelf</a>
              </li>
              <li>
                <a href="#features">Used Mobile Marketplace</a>
              </li>
              <li>
                <a href="#features">Customer CRM & WhatsApp</a>
              </li>
              <li>
                <a href="#features">Workshop Profit Analytics</a>
              </li>
              <li>
                <Link href="/login">Super Admin Console</Link>
              </li>
            </ul>
          </div>

          {/* Col 2: Solutions */}
          <div className="footer-links-col">
            <h4 className="footer-col-title">Solutions</h4>
            <ul className="footer-links-list">
              <li>
                <a href="#features">Mobile Phone Repair Shops</a>
              </li>
              <li>
                <a href="#features">Laptop & MacBook Service</a>
              </li>
              <li>
                <a href="#features">Electronics Franchises</a>
              </li>
              <li>
                <a href="#features">Independent Bench Technicians</a>
              </li>
              <li>
                <a href="#calculator">ROI Profit Estimator</a>
              </li>
              <li>
                <a href="#tracker">Public Customer Tracker</a>
              </li>
            </ul>
          </div>

          {/* Col 3: Quick Navigation */}
          <div className="footer-links-col">
            <h4 className="footer-col-title">Quick Links</h4>
            <ul className="footer-links-list">
              <li>
                <Link href="/about">About Our Mission & Team</Link>
              </li>
              <li>
                <Link href="/login">Technician Sign In</Link>
              </li>
              <li>
                <Link href="/register">Register New Workshop</Link>
              </li>
              <li>
                <a href="/#pricing">Subscription Plans</a>
              </li>
              <li>
                <a href="/#faq">Frequently Asked Questions</a>
              </li>
              <li>
                <a href="/#workflow">4-Step Workflow</a>
              </li>
              <li>
                <a href="/#tracker">Track Live Repair</a>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer Bottom Bar */}
        <div className="home-footer-bottom">
          <div className="footer-copyright">
            © {currentYear} Zapate Service Manager. Engineered for High-Volume Electronics Repair Centers.
          </div>

          <div className="footer-legal-links">
            <span className="footer-badge-secure">
              <ShieldCheck size={14} className="text-emerald-400" />
              <span>Multi-Tenant Cloud Isolated</span>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
