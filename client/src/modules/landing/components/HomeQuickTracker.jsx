import React, { useState } from 'react';
import {
  Search,
  CheckCircle2,
  Clock,
  Wrench,
  Package,
  ShieldCheck,
  Smartphone,
  Sparkles,
  ArrowRight,
  MessageCircle,
  FileText,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

const SAMPLE_REPAIRS = {
  'REP-8042': {
    jobId: 'REP-8042',
    customerName: 'Rohit Sharma',
    device: 'Apple iPhone 15 Pro Max (Titanium Blue)',
    imei: '354892109482711',
    reportedIssue: 'Cracked Super Retina XDR OLED & Broken Back Glass',
    status: 'IN_REPAIR',
    currentStep: 4, // 1 to 6
    techName: 'Alex Mercer (Level 3 Master Tech)',
    intakeDate: 'Today, 10:15 AM',
    estimatedReady: 'Today by 04:30 PM',
    partsUsed: ['OEM 120Hz Promotion Display Assembly', 'Back Glass Housing Laser Fit'],
    warranty: '180 Days Premium Screen Warranty',
    cost: '₹14,500',
    notes: 'FaceID sensor intact and calibrated. TrueTone serial rewritten successfully.',
  },
  'REP-8039': {
    jobId: 'REP-8039',
    customerName: 'Priya Nair',
    device: 'Apple MacBook Air M2 13" (Midnight)',
    imei: 'C02GK993MD6M',
    reportedIssue: 'Liquid spill on keyboard, device not powering on',
    status: 'WAITING_PARTS',
    currentStep: 3,
    techName: 'Elena Vance (Chip-Level Specialist)',
    intakeDate: 'Yesterday, 04:45 PM',
    estimatedReady: 'Tomorrow, 01:00 PM',
    partsUsed: ['Ultrasonic Board Cleaned', 'Keyboard Flex Ribbon Replacement'],
    warranty: '90 Days Chip-Level Warranty',
    cost: '₹18,900',
    notes: 'Ultrasonic bath completed. Power rails normal at 20V 0.05A. Keyboard flex ordered.',
  },
  'REP-8035': {
    jobId: 'REP-8035',
    customerName: 'Arun Kumar',
    device: 'OnePlus 12 5G (Flowy Emerald)',
    imei: '864920194820192',
    reportedIssue: 'Green line vertical display issue after software update',
    status: 'READY_PICKUP',
    currentStep: 6,
    techName: 'Rahul Singh',
    intakeDate: '02 Sep 2026',
    estimatedReady: 'Ready Now for Pickup',
    partsUsed: ['Original AMOLED Curved Panel', 'Adhesive Gasket'],
    warranty: '1 Year Display Warranty',
    cost: '₹8,500',
    notes: 'Display replaced and tested with 24-point QC pass. Customer notified on WhatsApp.',
  },
};

const STEPS = [
  { step: 1, label: 'Intake & Inspection', desc: 'Device logged with physical damage scan' },
  { step: 2, label: 'Diagnostic Check', desc: 'Hardware & electrical diagnostics passed' },
  { step: 3, label: 'Parts Allocated', desc: 'Genuine replacement parts reserved' },
  { step: 4, label: 'Bench Repair Active', desc: 'Technician actively repairing on bench' },
  { step: 5, label: 'Quality Assurance', desc: '24-point hardware & sensor QC verified' },
  { step: 6, label: 'Ready for Handover', desc: 'Job completed & packed for pickup' },
];

export const HomeQuickTracker = () => {
  const [searchQuery, setSearchQuery] = useState('REP-8042');
  const [activeRepair, setActiveRepair] = useState(SAMPLE_REPAIRS['REP-8042']);
  const [searched, setSearched] = useState(true);

  const handleSearch = (e) => {
    e?.preventDefault();
    const clean = searchQuery.trim().toUpperCase().replace('#', '');
    if (SAMPLE_REPAIRS[clean]) {
      setActiveRepair(SAMPLE_REPAIRS[clean]);
      setSearched(true);
      toast.success(`Found active job record: ${clean}`);
    } else {
      // Create dynamic dummy data for custom query so user gets interactive experience!
      const generated = {
        jobId: clean.startsWith('REP-') ? clean : `REP-${clean.slice(-4) || '9120'}`,
        customerName: 'Valued Client',
        device: 'Samsung Galaxy S24 Ultra (512GB)',
        imei: '358910492817492',
        reportedIssue: 'Battery draining fast & USB-C loose connection',
        status: 'IN_REPAIR',
        currentStep: 4,
        techName: 'Master Tech Alex',
        intakeDate: 'Today, 11:30 AM',
        estimatedReady: 'Today by 06:00 PM',
        partsUsed: ['OEM High-Capacity Battery', 'Type-C Sub-board'],
        warranty: '180 Days Zapate Service Manager Protection',
        cost: '₹4,800',
        notes: 'Battery health calibrated to 100%. Charge cycle reset. Final bench testing.',
      };
      setActiveRepair(generated);
      setSearched(true);
      toast.info(`Showing simulated live tracking record for: ${clean}`);
    }
  };

  const handleDemoPill = (id) => {
    setSearchQuery(id);
    setActiveRepair(SAMPLE_REPAIRS[id]);
    setSearched(true);
  };

  return (
    <section id="tracker" className="home-tracker-section">
      <div className="home-container">
        {/* Section Header */}
        <div className="home-section-header text-center">
          <div className="section-eyebrow">
            <Sparkles size={14} />
            <span>Interactive Customer Experience</span>
          </div>
          <h2 className="section-title">
            Live Repair Tracking for <span className="gradient-text">Your Customers</span>
          </h2>
          <p className="section-description">
            Build unshakeable trust. Customers can check real-time repair progress, view technician diagnosis notes,
            and receive automated WhatsApp notifications the exact second their device is ready.
          </p>
        </div>

        {/* Tracker Search Box */}
        <div className="tracker-card-container">
          <div className="tracker-search-bar">
            <form onSubmit={handleSearch} className="tracker-search-form">
              <div className="tracker-input-wrapper">
                <Search size={20} className="tracker-search-icon" />
                <input
                  type="text"
                  className="tracker-input"
                  placeholder="Enter Job Card Number (e.g. REP-8042) or Phone Number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <button type="submit" className="btn btn-primary tracker-btn">
                <span>Track Device</span>
                <ArrowRight size={16} />
              </button>
            </form>

            <div className="tracker-preset-pills">
              <span className="preset-label">Try instant sample job cards:</span>
              <button
                type="button"
                className={`preset-pill ${searchQuery === 'REP-8042' ? 'active' : ''}`}
                onClick={() => handleDemoPill('REP-8042')}
              >
                #REP-8042 (iPhone 15 Pro Max)
              </button>
              <button
                type="button"
                className={`preset-pill ${searchQuery === 'REP-8039' ? 'active' : ''}`}
                onClick={() => handleDemoPill('REP-8039')}
              >
                #REP-8039 (MacBook M2 Liquid)
              </button>
              <button
                type="button"
                className={`preset-pill ${searchQuery === 'REP-8035' ? 'active' : ''}`}
                onClick={() => handleDemoPill('REP-8035')}
              >
                #REP-8035 (OnePlus 12 AMOLED)
              </button>
            </div>
          </div>

          {/* Live Tracking Result Card */}
          {searched && activeRepair && (
            <div className="tracker-result-card">
              {/* Card Top Info */}
              <div className="tracker-result-header">
                <div className="device-main-info">
                  <div className="device-avatar-icon">
                    <Smartphone size={24} />
                  </div>
                  <div>
                    <div className="job-id-tag font-mono">JOB ID: #{activeRepair.jobId}</div>
                    <h3 className="device-model-name">{activeRepair.device}</h3>
                    <div className="device-sub-tags">
                      <span>Customer: <strong>{activeRepair.customerName}</strong></span>
                      <span>•</span>
                      <span>IMEI: <strong className="font-mono">{activeRepair.imei}</strong></span>
                    </div>
                  </div>
                </div>

                <div className="tracker-header-badges">
                  <div className={`status-badge-live step-${activeRepair.currentStep}`}>
                    <span className="pulse-dot" />
                    <span>
                      {activeRepair.currentStep === 6
                        ? 'READY FOR PICKUP'
                        : activeRepair.currentStep >= 4
                        ? 'ON BENCH (IN REPAIR)'
                        : 'DIAGNOSTIC & PARTS'}
                    </span>
                  </div>
                  <div className="eta-badge">
                    <Clock size={13} />
                    <span>ETA: {activeRepair.estimatedReady}</span>
                  </div>
                </div>
              </div>

              {/* Stepper Progress Bar */}
              <div className="tracker-stepper">
                {STEPS.map((step) => {
                  const isCompleted = step.step < activeRepair.currentStep;
                  const isCurrent = step.step === activeRepair.currentStep;

                  return (
                    <div
                      key={step.step}
                      className={`stepper-node ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''}`}
                    >
                      <div className="stepper-circle">
                        {isCompleted ? <CheckCircle2 size={16} /> : <span>{step.step}</span>}
                      </div>
                      <div className="stepper-text">
                        <div className="stepper-title">{step.label}</div>
                        <div className="stepper-desc">{step.desc}</div>
                      </div>
                      {step.step < STEPS.length && <div className="stepper-connector" />}
                    </div>
                  );
                })}
              </div>

              {/* Technician Notes & Warranty Grid */}
              <div className="tracker-details-grid">
                <div className="tracker-info-box">
                  <div className="info-box-title">
                    <Wrench size={15} className="text-blue-500" />
                    <span>Technician Diagnostic Notes</span>
                  </div>
                  <p className="info-box-text">{activeRepair.notes}</p>
                  <div className="info-box-footer">
                    <span>Assigned Specialist: <strong>{activeRepair.techName}</strong></span>
                  </div>
                </div>

                <div className="tracker-info-box">
                  <div className="info-box-title">
                    <Package size={15} className="text-emerald-500" />
                    <span>Installed OEM Parts & Warranty</span>
                  </div>
                  <ul className="parts-list">
                    {activeRepair.partsUsed.map((p, idx) => (
                      <li key={idx}>✓ {p}</li>
                    ))}
                  </ul>
                  <div className="warranty-tag">
                    <ShieldCheck size={14} />
                    <span>{activeRepair.warranty}</span>
                  </div>
                </div>

                <div className="tracker-info-box tracker-estimate-box">
                  <div className="info-box-title">
                    <FileText size={15} className="text-amber-500" />
                    <span>Service Estimate</span>
                  </div>
                  <div className="estimate-price-value">{activeRepair.cost}</div>
                  <p className="estimate-caption">Includes all genuine parts, precision labor & warranty</p>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm btn-full"
                    onClick={() => toast.success('Mock receipt downloaded / sent to customer WhatsApp!')}
                  >
                    <MessageCircle size={14} />
                    <span>Send Update on WhatsApp</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
