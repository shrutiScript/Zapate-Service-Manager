import React, { useState } from 'react';
import { Link } from 'wouter';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Zap,
  Layers,
  Receipt,
  Package,
  BarChart3,
  Smartphone,
  Wrench,
  Clock,
  Printer,
  ChevronRight,
  Search,
  Check,
  TrendingUp,
  CreditCard,
  UserCheck,
  Play,
  Cpu
} from 'lucide-react';

export const HomeHero = () => {
  const [activeTab, setActiveTab] = useState('bench');

  return (
    <section className="home-hero-section">
      {/* Background Ambient Motion Glows & Circuit Mesh */}
      <div className="home-hero-glow-1" />
      <div className="home-hero-glow-2" />
      <div className="circuit-grid-overlay" />

      {/* Floating Motion Graphic Badges */}
      <div className="floating-badge badge-float-top-left">
        <div className="float-badge-icon bg-blue">
          <Wrench size={14} />
        </div>
        <div>
          <span className="float-badge-title">iPhone 15 Pro OLED</span>
          <span className="float-badge-sub">QC Passed • 100% Calibrated</span>
        </div>
      </div>

      <div className="floating-badge badge-float-top-right">
        <div className="float-badge-icon bg-emerald">
          <CheckCircle2 size={14} />
        </div>
        <div>
          <span className="float-badge-title">WhatsApp Sent!</span>
          <span className="float-badge-sub">Customer notified for pickup</span>
        </div>
      </div>

      <div className="floating-badge badge-float-bottom-left">
        <div className="float-badge-icon bg-amber">
          <Printer size={14} />
        </div>
        <div>
          <span className="float-badge-title">Instant Thermal POS</span>
          <span className="float-badge-sub">₹14,500 Paid via UPI</span>
        </div>
      </div>

      <div className="home-container home-hero-content-wrapper">
        {/* Top Feature Pill with Motion Pulse */}
        <div className="home-hero-badge-pill motion-pulse-pill">
          <span className="badge-glow-dot" />
          <Sparkles size={14} className="text-amber-400" />
          <span>Simple, Fast & Professional Workshop OS</span>
          <span className="badge-divider">•</span>
          <span className="badge-highlight">1-Click Setup</span>
          <ChevronRight size={13} />
        </div>

        {/* Hero Title */}
        <h1 className="home-hero-title">
          Run Your Repair Shop with <br />
          <span className="gradient-text motion-gradient-text">Complete Clarity & Speed</span>
        </h1>

        {/* Hero Subtitle */}
        <p className="home-hero-subtitle">
          Manage customer check-ins, bench repairs, spare parts inventory, and express POS receipts in one beautifully simple system. Built specifically for mobile & electronics repair centers.
        </p>

        {/* CTA Button Group */}
        <div className="home-hero-cta-group">
          <Link href="/register" className="btn btn-primary btn-hero-primary motion-cta-glow">
            <span>Start Free 14-Day Trial</span>
            <ArrowRight size={18} />
          </Link>
          <Link href="/login" className="btn btn-outline btn-hero-secondary">
            <ShieldCheck size={18} />
            <span>Master Demo Access</span>
          </Link>
        </div>

        {/* Micro Guarantee */}
        <div className="home-hero-guarantee">
          <span>✓ 100% Easy to learn in 5 minutes</span>
          <span>✓ Works on any Phone, Tablet or PC</span>
          <span>✓ Compatible with all Thermal Printers</span>
        </div>

        {/* Metrics Strip */}
        <div className="home-metrics-strip">
          <div className="metric-strip-item">
            <div className="metric-val font-mono">150,000+</div>
            <div className="metric-lbl">Devices Repaired</div>
          </div>
          <div className="metric-strip-divider" />
          <div className="metric-strip-item">
            <div className="metric-val font-mono">3.8x</div>
            <div className="metric-lbl">Faster Check-ins</div>
          </div>
          <div className="metric-strip-divider" />
          <div className="metric-strip-item">
            <div className="metric-val font-mono">99.98%</div>
            <div className="metric-lbl">Cloud Reliability</div>
          </div>
          <div className="metric-strip-divider" />
          <div className="metric-strip-item">
            <div className="metric-val font-mono">4.9 ★</div>
            <div className="metric-lbl">Workshop Rating</div>
          </div>
        </div>

        {/* Interactive Hero Showcase Frame with Motion Border */}
        <div id="preview" className="home-showcase-window motion-card-border">
          {/* Showcase Window Titlebar */}
          <div className="showcase-window-header">
            <div className="showcase-dots">
              <span className="dot dot-red" />
              <span className="dot dot-yellow" />
              <span className="dot dot-green" />
            </div>
            <div className="showcase-search-bar">
              <Search size={13} className="text-slate-400" />
              <span>https://app.zapateservicemanager.com/workbench/live</span>
            </div>
            <div className="showcase-live-status">
              <span className="live-indicator-pulse" />
              <span>LIVE WORKBENCH</span>
            </div>
          </div>

          {/* Showcase Interactive Tab Selector */}
          <div className="showcase-tab-bar">
            <button
              type="button"
              className={`showcase-tab-btn ${activeTab === 'bench' ? 'active' : ''}`}
              onClick={() => setActiveTab('bench')}
            >
              <Wrench size={16} />
              <span>1. Repair Bench & Kanban</span>
            </button>
            <button
              type="button"
              className={`showcase-tab-btn ${activeTab === 'pos' ? 'active' : ''}`}
              onClick={() => setActiveTab('pos')}
            >
              <Receipt size={16} />
              <span>2. POS & Thermal Invoice</span>
            </button>
            <button
              type="button"
              className={`showcase-tab-btn ${activeTab === 'inventory' ? 'active' : ''}`}
              onClick={() => setActiveTab('inventory')}
            >
              <Package size={16} />
              <span>3. Parts & Stock Engine</span>
            </button>
            <button
              type="button"
              className={`showcase-tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
              onClick={() => setActiveTab('analytics')}
            >
              <BarChart3 size={16} />
              <span>4. Financial Pulse & KPI</span>
            </button>
          </div>

          {/* Showcase Screen Body */}
          <div className="showcase-screen-body">
            {/* TAB 1: REPAIR BENCH KANBAN */}
            {activeTab === 'bench' && (
              <div className="preview-kanban-board">
                {/* Column 1: Diagnostic */}
                <div className="preview-kanban-col">
                  <div className="preview-col-header">
                    <div className="col-title-badge bg-blue">DIAGNOSIS (2)</div>
                    <span className="col-count">Bench #1</span>
                  </div>
                  <div className="preview-ticket-card">
                    <div className="ticket-top">
                      <span className="ticket-id">#REP-8042</span>
                      <span className="priority-tag high">URGENT</span>
                    </div>
                    <div className="ticket-device">Apple iPhone 15 Pro Max</div>
                    <div className="ticket-fault">OLED Glass Cracked • No Touch Response</div>
                    <div className="ticket-meta">
                      <span className="ticket-tech">Tech: Alex M.</span>
                      <span className="ticket-price">₹14,500</span>
                    </div>
                  </div>
                  <div className="preview-ticket-card">
                    <div className="ticket-top">
                      <span className="ticket-id">#REP-8045</span>
                      <span className="priority-tag medium">NORMAL</span>
                    </div>
                    <div className="ticket-device">Samsung Galaxy S23 Ultra</div>
                    <div className="ticket-fault">Type-C Port Moisture Error • No Fast Charge</div>
                    <div className="ticket-meta">
                      <span className="ticket-tech">Tech: Rahul S.</span>
                      <span className="ticket-price">₹3,200</span>
                    </div>
                  </div>
                </div>

                {/* Column 2: In Progress */}
                <div className="preview-kanban-col">
                  <div className="preview-col-header">
                    <div className="col-title-badge bg-amber">IN PROGRESS (2)</div>
                    <span className="col-count">Bench #2</span>
                  </div>
                  <div className="preview-ticket-card card-active-glow">
                    <div className="ticket-top">
                      <span className="ticket-id">#REP-8039</span>
                      <span className="status-pill active-repair">
                        <Zap size={11} />
                        ON BENCH
                      </span>
                    </div>
                    <div className="ticket-device">MacBook Air M2 13"</div>
                    <div className="ticket-fault">Logic Board Ultrasonic Cleaning + Battery Swap</div>
                    <div className="ticket-progress-bar">
                      <div className="progress-fill motion-progress-pulse" style={{ width: '75%' }} />
                    </div>
                    <div className="ticket-meta">
                      <span className="ticket-tech">Tech: Elena V.</span>
                      <span className="ticket-price">₹18,900</span>
                    </div>
                  </div>
                  <div className="preview-ticket-card">
                    <div className="ticket-top">
                      <span className="ticket-id">#REP-8040</span>
                      <span className="priority-tag low">NORMAL</span>
                    </div>
                    <div className="ticket-device">Google Pixel 8 Pro</div>
                    <div className="ticket-fault">Camera Lens Replacement & Calibration</div>
                    <div className="ticket-meta">
                      <span className="ticket-tech">Tech: Alex M.</span>
                      <span className="ticket-price">₹5,400</span>
                    </div>
                  </div>
                </div>

                {/* Column 3: Ready for Pickup */}
                <div className="preview-kanban-col">
                  <div className="preview-col-header">
                    <div className="col-title-badge bg-emerald">READY FOR PICKUP (2)</div>
                    <span className="col-count">Front Counter</span>
                  </div>
                  <div className="preview-ticket-card card-ready">
                    <div className="ticket-top">
                      <span className="ticket-id">#REP-8035</span>
                      <span className="status-pill qc-pass">
                        <CheckCircle2 size={11} />
                        QC PASSED
                      </span>
                    </div>
                    <div className="ticket-device">OnePlus 12 5G</div>
                    <div className="ticket-fault">Display Assembly Replaced + 90-Day Warranty</div>
                    <div className="ticket-alert-sent">
                      <span>💬 WhatsApp Pickup Notification Sent</span>
                    </div>
                    <div className="ticket-meta">
                      <span className="customer-name">Arun Kumar</span>
                      <span className="ticket-price-paid">₹8,500 (PAID)</span>
                    </div>
                  </div>
                  <div className="preview-ticket-card card-ready">
                    <div className="ticket-top">
                      <span className="ticket-id">#REP-8036</span>
                      <span className="status-pill qc-pass">
                        <CheckCircle2 size={11} />
                        READY
                      </span>
                    </div>
                    <div className="ticket-device">iPad Pro 11" 4th Gen</div>
                    <div className="ticket-fault">Digitizer Glass + TrueTone Restored</div>
                    <div className="ticket-meta">
                      <span className="customer-name">Sophia Clark</span>
                      <span className="ticket-price">₹11,200</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: SMART POS & BILLING */}
            {activeTab === 'pos' && (
              <div className="preview-pos-grid">
                <div className="preview-pos-terminal">
                  <div className="pos-terminal-header">
                    <div>
                      <h4>Express POS Checkout</h4>
                      <p>Walk-in customer & quick repairs billing</p>
                    </div>
                    <div className="pos-badge-live">Thermal Print Ready 🖨️</div>
                  </div>

                  <div className="pos-items-table">
                    <div className="pos-table-row pos-header-row">
                      <span>Item / Service Description</span>
                      <span>Qty</span>
                      <span>Rate</span>
                      <span>Total</span>
                    </div>
                    <div className="pos-table-row">
                      <div>
                        <strong>OEM iPhone 14 Pro OLED Display</strong>
                        <small>SKU: DISP-IP14P-ORIG (120Hz Promotion)</small>
                      </div>
                      <span>1</span>
                      <span>₹12,500</span>
                      <span>₹12,500</span>
                    </div>
                    <div className="pos-table-row">
                      <div>
                        <strong>Precision Bench Labor & Water Seal</strong>
                        <small>Service Code: LAB-IP-DISP</small>
                      </div>
                      <span>1</span>
                      <span>₹1,500</span>
                      <span>₹1,500</span>
                    </div>
                    <div className="pos-table-row">
                      <div>
                        <strong>9H Tempered Ceramic Armor Guard</strong>
                        <small>SKU: ACC-SCR-IP14P</small>
                      </div>
                      <span>1</span>
                      <span>₹499</span>
                      <span>₹499</span>
                    </div>
                  </div>

                  <div className="pos-payment-summary">
                    <div className="summary-row">
                      <span>Subtotal:</span>
                      <span>₹14,499</span>
                    </div>
                    <div className="summary-row">
                      <span>GST / Tax (18%):</span>
                      <span>₹2,609</span>
                    </div>
                    <div className="summary-row total">
                      <span>Total Payable:</span>
                      <span className="total-val">₹17,108</span>
                    </div>
                  </div>
                </div>

                {/* Simulated Thermal Receipt */}
                <div className="preview-thermal-card">
                  <div className="thermal-paper">
                    <div className="thermal-header">
                      <h3>ZAPATE SERVICE MANAGER</h3>
                      <p>MG Road, Suite 402, Bengaluru</p>
                      <p>GSTIN: 29AAAAA0000A1Z5</p>
                      <div className="thermal-divider" />
                      <p className="font-mono">INVOICE: #INV-2026-0849</p>
                      <p className="font-mono">DATE: 04-Sep-2026 14:32</p>
                      <div className="thermal-divider" />
                    </div>
                    <div className="thermal-body">
                      <div className="thermal-line">
                        <span>1x OLED Screen IP14P</span>
                        <span>₹12,500</span>
                      </div>
                      <div className="thermal-line">
                        <span>1x Precision Bench Labor</span>
                        <span>₹1,500</span>
                      </div>
                      <div className="thermal-line">
                        <span>1x Ceramic Screen Guard</span>
                        <span>₹499</span>
                      </div>
                      <div className="thermal-divider" />
                      <div className="thermal-line font-bold">
                        <span>NET TOTAL:</span>
                        <span>₹17,108</span>
                      </div>
                      <div className="thermal-line">
                        <span>PAID VIA UPI:</span>
                        <span>₹17,108</span>
                      </div>
                    </div>
                    <div className="thermal-footer">
                      <p>WARRANTY: 90 DAYS BENCH WARRANTY</p>
                      <div className="thermal-barcode">||| | | |||| | ||| |||| |</div>
                      <small>Thank you for choosing Zapate Service Manager!</small>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: PARTS & STOCK ENGINE */}
            {activeTab === 'inventory' && (
              <div className="preview-inventory-grid">
                <div className="inv-stat-card">
                  <div className="inv-stat-header">
                    <Package size={18} className="text-blue-500" />
                    <span className="badge-stock in">Active SKUs: 1,420</span>
                  </div>
                  <div className="inv-stat-body">
                    <h3>₹8,42,500</h3>
                    <p>Total Stock Valuation (Wholesale Cost)</p>
                  </div>
                </div>
                <div className="inv-stat-card">
                  <div className="inv-stat-header">
                    <Zap size={18} className="text-amber-500" />
                    <span className="badge-stock warning">Low Stock: 4 Items</span>
                  </div>
                  <div className="inv-stat-body">
                    <h3>Auto-Reorder</h3>
                    <p>Supplier PO generated automatically</p>
                  </div>
                </div>

                <div className="inv-table-preview">
                  <div className="inv-table-header">
                    <span>Part Name / Model</span>
                    <span>Category</span>
                    <span>In Stock</span>
                    <span>Cost / Retail</span>
                    <span>Status</span>
                  </div>
                  <div className="inv-table-row">
                    <div>
                      <strong>iPhone 13 OLED Assembly (Grade A+)</strong>
                      <small>SKU: SCR-IP13-OEM</small>
                    </div>
                    <span>Screens</span>
                    <span className="font-mono">18 pcs</span>
                    <span>₹4,200 / ₹6,800</span>
                    <span className="stock-pill in-stock">Optimal</span>
                  </div>
                  <div className="inv-table-row highlight-low">
                    <div>
                      <strong>Samsung Galaxy S22 Ultra Battery (5000mAh)</strong>
                      <small>SKU: BAT-SM-S22U</small>
                    </div>
                    <span>Batteries</span>
                    <span className="font-mono text-danger font-bold">2 pcs</span>
                    <span>₹1,100 / ₹2,400</span>
                    <span className="stock-pill low-stock">Low Stock (Min 5)</span>
                  </div>
                  <div className="inv-table-row">
                    <div>
                      <strong>OnePlus 11 Charging Flex Ribbon</strong>
                      <small>SKU: FLX-OP11-CHG</small>
                    </div>
                    <span>Flex Cables</span>
                    <span className="font-mono">12 pcs</span>
                    <span>₹450 / ₹1,200</span>
                    <span className="stock-pill in-stock">Optimal</span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: WORKSHOP ANALYTICS */}
            {activeTab === 'analytics' && (
              <div className="preview-analytics-grid">
                <div className="analytics-kpi-card">
                  <div className="kpi-label">Today's Revenue</div>
                  <div className="kpi-value font-mono">₹48,950</div>
                  <div className="kpi-trend positive">
                    <TrendingUp size={14} />
                    <span>+24.8% vs last week</span>
                  </div>
                </div>

                <div className="analytics-kpi-card">
                  <div className="kpi-label">Repairs Delivered Today</div>
                  <div className="kpi-value font-mono">16 Devices</div>
                  <div className="kpi-sub">Avg Turnaround: 2.1 Hours</div>
                </div>

                <div className="analytics-kpi-card">
                  <div className="kpi-label">Gross Profit Margin</div>
                  <div className="kpi-value font-mono">64.2%</div>
                  <div className="kpi-sub">Parts: 42% • Labor: 88%</div>
                </div>

                <div className="analytics-kpi-card">
                  <div className="kpi-label">Customer Satisfaction</div>
                  <div className="kpi-value font-mono">98.9%</div>
                  <div className="kpi-sub">4.9 / 5.0 Google Reviews</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
