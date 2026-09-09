import React, { useState } from 'react';
import {
  XCircle,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Clock,
  Smartphone,
  MessageCircle,
  ShieldCheck,
  TrendingUp,
  Receipt,
  FileSpreadsheet,
  AlertTriangle
} from 'lucide-react';
import { Link } from 'wouter';

export const HomeVisualOverview = () => {
  const [viewMode, setViewMode] = useState('comparison'); // 'comparison' or 'animated'

  return (
    <section className="home-visual-overview-section">
      <div className="home-container">
        {/* Section Header */}
        <div className="home-section-header text-center">
          <div className="section-eyebrow">
            <Sparkles size={14} className="text-amber-400" />
            <span>Simple & Clear Comparison</span>
          </div>
          <h2 className="section-title">
            The Difference is <span className="gradient-text">Night and Day</span>
          </h2>
          <p className="section-description">
            See how Zapate Service Manager replaces slow, error-prone manual methods with a clean, automated digital workbench that
            anyone on your team can master in 5 minutes.
          </p>
        </div>

        {/* Side-by-Side Comparison Cards */}
        <div className="overview-comparison-grid">
          {/* Card 1: The Old Painful Way */}
          <div className="comparison-card card-old-way">
            <div className="comparison-card-badge badge-danger">
              <XCircle size={14} />
              <span>THE OLD CHAOTIC WAY</span>
            </div>
            <h3 className="comparison-title">Paper Slips, WhatsApp Chasing & Excel Sheets</h3>

            <div className="comparison-items-list">
              <div className="comparison-item item-negative">
                <div className="item-icon-neg">❌</div>
                <div>
                  <strong>Lost Paper Tickets & Misplaced Devices</strong>
                  <p>Handwritten slips get lost, damaged, or separated from customer devices.</p>
                </div>
              </div>

              <div className="comparison-item item-negative">
                <div className="item-icon-neg">❌</div>
                <div>
                  <strong>Frustrated Customers Calling All Day</strong>
                  <p>Staff wastes hours answering repeated calls: "Is my screen fixed yet?".</p>
                </div>
              </div>

              <div className="comparison-item item-negative">
                <div className="item-icon-neg">❌</div>
                <div>
                  <strong>Missing Spare Parts & Inventory Shrinkage</strong>
                  <p>Expensive OLED screens and batteries go missing with zero accountability.</p>
                </div>
              </div>

              <div className="comparison-item item-negative">
                <div className="item-icon-neg">❌</div>
                <div>
                  <strong>End-of-Day Cash & UPI Mismatches</strong>
                  <p>Guessing daily profit and stressing over cash drawer calculation errors.</p>
                </div>
              </div>
            </div>

            <div className="comparison-card-footer footer-negative">
              <span>⚠️ Result: Stressed technicians, delayed repairs & lost profit</span>
            </div>
          </div>

          {/* Card 2: The Zapate Service Manager Way */}
          <div className="comparison-card card-zapate-way">
            <div className="motion-glow-corner" />
            <div className="comparison-card-badge badge-success">
              <CheckCircle2 size={14} />
              <span>THE ZAPATE SERVICE MANAGER WAY (CLEAN & FAST)</span>
            </div>
            <h3 className="comparison-title">One Automated Screen for Your Entire Workshop</h3>

            <div className="comparison-items-list">
              <div className="comparison-item item-positive">
                <div className="item-icon-pos">
                  <CheckCircle2 size={16} />
                </div>
                <div>
                  <strong>30-Second Digital Intake & Barcode Sticker</strong>
                  <p>Stick a barcode tag on the device bag. Scan it anytime to see the full history.</p>
                </div>
              </div>

              <div className="comparison-item item-positive">
                <div className="item-icon-pos">
                  <MessageCircle size={16} />
                </div>
                <div>
                  <strong>Automatic WhatsApp & SMS Status Alerts</strong>
                  <p>Customers automatically receive a message when their device is ready for pickup.</p>
                </div>
              </div>

              <div className="comparison-item item-positive">
                <div className="item-icon-pos">
                  <ShieldCheck size={16} />
                </div>
                <div>
                  <strong>Live Parts Deduction & Theft Prevention</strong>
                  <p>Every screen and battery is linked to technician ID and device IMEI.</p>
                </div>
              </div>

              <div className="comparison-item item-positive">
                <div className="item-icon-pos">
                  <TrendingUp size={16} />
                </div>
                <div>
                  <strong>Instant Thermal POS & Real-Time Profit</strong>
                  <p>Print GST/VAT receipts with warranty terms in 1 second. 100% accurate bookkeeping.</p>
                </div>
              </div>
            </div>

            <div className="comparison-card-footer footer-positive">
              <span>🚀 Result: 3.8x faster throughput, happy customers & higher profits</span>
            </div>
          </div>
        </div>

        {/* Quick 3-Step Interactive Summary Banner */}
        <div className="quick-action-strip">
          <div className="strip-col">
            <div className="strip-num">1</div>
            <div className="strip-text">
              <h4>Walk-In Intake</h4>
              <p>Scan IMEI & print barcode tag in 30s</p>
            </div>
          </div>
          <div className="strip-arrow">➔</div>
          <div className="strip-col">
            <div className="strip-num">2</div>
            <div className="strip-text">
              <h4>Bench Repair & QC</h4>
              <p>Technician tests device & logs parts</p>
            </div>
          </div>
          <div className="strip-arrow">➔</div>
          <div className="strip-col">
            <div className="strip-num">3</div>
            <div className="strip-text">
              <h4>Pickup & Thermal POS</h4>
              <p>WhatsApp alert sent & receipt printed</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
