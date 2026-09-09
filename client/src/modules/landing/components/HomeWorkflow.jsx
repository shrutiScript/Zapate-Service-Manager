import React, { useState } from 'react';
import {
  Smartphone,
  Wrench,
  CheckCircle2,
  Receipt,
  ArrowRight,
  Sparkles,
  Zap,
  MessageCircle,
  Clock,
  Printer,
  ShieldCheck
} from 'lucide-react';

const WORKFLOW_STEPS = [
  {
    number: '01',
    title: '30-Second Walk-in Intake',
    badge: 'Front Desk Speed',
    description:
      'Log customer details, device model, cosmetic scratches, unlock pattern, and reported issue. The system prints a barcode intake ticket and sends a digital WhatsApp confirmation instantly.',
    points: ['Barcode sticker for device bag', 'Customer pre-repair sign-off', 'Instant WhatsApp acknowledgment'],
    previewPill: '⏱️ Average Time: 45 Seconds',
  },
  {
    number: '02',
    title: 'Bench Diagnosis & Parts Allocation',
    badge: 'Technician Bench',
    description:
      'Job ticket appears instantly on the technician Kanban queue. The technician inspects the motherboard, reserves genuine spare parts from inventory, and updates the diagnostic estimate.',
    points: ['Auto inventory reservation', 'Technician labor allocation', 'Customer approval flow via SMS'],
    previewPill: '⚡ Real-time Kanban Synced',
  },
  {
    number: '03',
    title: 'Precision Repair & 24-Point QC',
    badge: 'Quality Control',
    description:
      'Technician completes the hardware replacement and runs the built-in 24-point Quality Assurance checklist (FaceID, Touch, Charging, Microphones). Once passed, an automated pickup notification fires.',
    points: ['Sensor & TrueTone validation', 'Water-resistance seal check', 'Automated ready-for-pickup alert'],
    previewPill: '✅ Zero Return Rates',
  },
  {
    number: '04',
    title: 'Express POS Billing & Warranty',
    badge: 'Counter Handover',
    description:
      'Customer walks in, cashier scans the job card barcode, collects payment via UPI/Card/Cash, and prints a professional thermal receipt with warranty terms and review QR code.',
    points: ['Instant thermal receipt', 'Digital warranty activation', 'Daily cash drawer settled'],
    previewPill: '🧾 5-Star Customer Experience',
  },
];

export const HomeWorkflow = () => {
  const [activeStep, setActiveStep] = useState(0);

  return (
    <section id="workflow" className="home-workflow-section">
      <div className="home-container">
        {/* Section Header */}
        <div className="home-section-header text-center">
          <div className="section-eyebrow">
            <Clock size={14} />
            <span>End-to-End Workflow</span>
          </div>
          <h2 className="section-title">
            From Walk-In to 5-Star Review in <span className="gradient-text">4 Seamless Steps</span>
          </h2>
          <p className="section-description">
            Experience how Zapate Service Manager eliminates bench clutter, miscommunication, lost tickets, and inventory leakages.
          </p>
        </div>

        {/* 4 Steps Interactive Grid */}
        <div className="workflow-cards-grid">
          {WORKFLOW_STEPS.map((step, idx) => (
            <div
              key={step.number}
              className={`workflow-step-card ${activeStep === idx ? 'step-active' : ''}`}
              onMouseEnter={() => setActiveStep(idx)}
            >
              <div className="workflow-step-top">
                <span className="workflow-number">{step.number}</span>
                <span className="workflow-badge">{step.badge}</span>
              </div>

              <h3 className="workflow-step-title">{step.title}</h3>
              <p className="workflow-step-desc">{step.description}</p>

              <div className="workflow-step-points">
                {step.points.map((pt, pIdx) => (
                  <div key={pIdx} className="workflow-point-item">
                    <CheckCircle2 size={13} className="text-blue-500" />
                    <span>{pt}</span>
                  </div>
                ))}
              </div>

              <div className="workflow-step-footer">
                <span className="workflow-preview-pill">{step.previewPill}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
