import React from 'react';
import { Star, Quote, CheckCircle2, Store, Sparkles } from 'lucide-react';

const TESTIMONIALS = [
  {
    id: 1,
    name: 'Vikramaditya Rao',
    role: 'Founder & Master Tech',
    shop: 'iFixHub Mobile Care (3 Locations, Bengaluru)',
    rating: 5,
    quote:
      'Before Zapate Service Manager, our technicians were scrambling between handwritten job paper slips, WhatsApp messages, and Excel sheets. Now, from customer walk-in to thermal receipt and WhatsApp pickup alerts, everything is completely automated. We do 35+ repairs daily with zero ticket confusion.',
    stat: '3.5x Faster Check-ins',
    avatarLetter: 'V',
    avatarBg: '#2563eb',
  },
  {
    id: 2,
    name: 'Sameer Sheikh',
    role: 'Operations Director',
    shop: 'QuickFix Electronics & Laptop Hub (Mumbai)',
    rating: 5,
    quote:
      'The parts inventory deduction feature alone saved our shop over ₹70,000 in missing spare screens and batteries in the first two months. Being able to track every screen replacement against technician ID and customer IMEI gives total operational accountability.',
    stat: '₹70K+ Shrinkage Saved',
    avatarLetter: 'S',
    avatarBg: '#10b981',
  },
  {
    id: 3,
    name: 'Ananya Deshmukh',
    role: 'Franchise Partner',
    shop: 'SmartCare Mobile Solutions (Pune & Hyderabad)',
    rating: 5,
    quote:
      'Our customers are blown away when they get a WhatsApp notification with live repair tracking and when our counter prints a sleek thermal tax invoice with warranty terms. Our Google Review rating jumped from 4.2 to 4.9 in 90 days!',
    stat: '4.9★ Google Rating',
    avatarLetter: 'A',
    avatarBg: '#8b5cf6',
  },
];

export const HomeTestimonials = () => {
  return (
    <section className="home-testimonials-section">
      <div className="home-container">
        {/* Header */}
        <div className="home-section-header text-center">
          <div className="section-eyebrow">
            <Star size={14} className="text-amber-400" />
            <span>Proven in 1,200+ Workshops</span>
          </div>
          <h2 className="section-title">
            Loved by Modern <span className="gradient-text">Repair Technicians & Owners</span>
          </h2>
          <p className="section-description">
            See how high-volume repair shops transformed bench velocity, customer satisfaction, and daily profit margins.
          </p>
        </div>

        {/* Testimonial Cards Grid */}
        <div className="testimonials-grid">
          {TESTIMONIALS.map((item) => (
            <div key={item.id} className="testimonial-card">
              {/* Star Rating */}
              <div className="testimonial-stars-row">
                {[...Array(item.rating)].map((_, i) => (
                  <Star key={i} size={16} className="star-filled" />
                ))}
              </div>

              {/* Quote Body */}
              <p className="testimonial-quote">"{item.quote}"</p>

              {/* Verified Metric Pill */}
              <div className="testimonial-metric-pill">
                <CheckCircle2 size={13} className="text-emerald-500" />
                <span>Verified Impact: <strong>{item.stat}</strong></span>
              </div>

              {/* Author Footer */}
              <div className="testimonial-author">
                <div
                  className="author-avatar"
                  style={{ backgroundColor: item.avatarBg }}
                >
                  {item.avatarLetter}
                </div>
                <div className="author-meta">
                  <div className="author-name">{item.name}</div>
                  <div className="author-role">{item.role}</div>
                  <div className="author-shop">
                    <Store size={12} className="inline mr-1 text-slate-400" />
                    {item.shop}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
