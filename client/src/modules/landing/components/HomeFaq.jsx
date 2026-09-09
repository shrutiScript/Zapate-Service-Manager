import React, { useState } from 'react';
import { ChevronDown, HelpCircle, Sparkles } from 'lucide-react';

const FAQS = [
  {
    q: 'Can I connect my existing thermal receipt printer (58mm / 80mm) and barcode scanner?',
    a: 'Yes, 100%! Zapate Service Manager is built specifically for standard workshop POS hardware. It works seamlessly with all USB, Bluetooth, Wi-Fi thermal printers (2-inch 58mm & 3-inch 80mm ESC/POS) as well as regular A4/A5 laser printers and plug-and-play USB 1D/2D barcode scanners.',
  },
  {
    q: 'Does Zapate Service Manager support multiple workshop branches and role-based staff permissions?',
    a: 'Absolutely. You can manage multiple physical workshop locations from a single dashboard. You can create specialized roles with granular access controls — for example, allowing Bench Technicians to update repair status and view parts stock without seeing wholesale profit margins or super-admin settings.',
  },
  {
    q: 'Can customers track their repair status online without needing to create an account?',
    a: 'Yes! Every repair generates a unique Job Card ID (e.g. #REP-8042). Customers can simply visit your tracking page, enter their Job ID or phone number, and see live progress (Intake -> Diagnosis -> In Repair -> QC Passed -> Ready for Pickup) along with technician notes.',
  },
  {
    q: 'How does parts inventory deduction work when a repair is completed?',
    a: 'When a technician selects replacement parts (such as an OEM display or high-capacity battery) on a job card, the stock count is automatically reserved. When the job is finalized or checked out at POS, inventory is instantly deducted and profit margins are calculated in real-time.',
  },
  {
    q: 'Can I buy, test, and sell refurbished / used phones?',
    a: 'Yes! Zapate Service Manager includes a dedicated Used Mobile & Refurbished Device module. You can log buyback purchases with customer ID proof, run IMEI condition grading (A+, A, B), record refurbishment costs, and issue warranty certificates upon resale.',
  },
  {
    q: 'How does the free 14-day trial work? Is a credit card required?',
    a: 'No credit card is required. You can register your workshop in 60 seconds and immediately start creating job cards, testing POS billing, managing parts inventory, and inviting your technicians. You have full access to all Pro features during the trial.',
  },
];

export const HomeFaq = () => {
  const [openIdx, setOpenIdx] = useState(0);

  const toggleFaq = (idx) => {
    setOpenIdx(openIdx === idx ? -1 : idx);
  };

  return (
    <section id="faq" className="home-faq-section">
      <div className="home-container">
        {/* Section Header */}
        <div className="home-section-header text-center">
          <div className="section-eyebrow">
            <HelpCircle size={14} />
            <span>Got Questions? We Have Answers</span>
          </div>
          <h2 className="section-title">
            Frequently Asked <span className="gradient-text">Questions</span>
          </h2>
          <p className="section-description">
            Everything you need to know about setting up Zapate Service Manager in your workshop or franchise.
          </p>
        </div>

        {/* FAQ Accordion List */}
        <div className="faq-accordion-list">
          {FAQS.map((faq, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div
                key={idx}
                className={`faq-accordion-item ${isOpen ? 'faq-item-open' : ''}`}
              >
                <button
                  type="button"
                  className="faq-question-btn"
                  onClick={() => toggleFaq(idx)}
                  aria-expanded={isOpen}
                >
                  <span className="faq-question-text">{faq.q}</span>
                  <div className={`faq-chevron-icon ${isOpen ? 'rotated' : ''}`}>
                    <ChevronDown size={18} />
                  </div>
                </button>

                {isOpen && (
                  <div className="faq-answer-pane">
                    <p>{faq.a}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
