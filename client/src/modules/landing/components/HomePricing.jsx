import React, { useState, useEffect } from 'react';
import { Link } from 'wouter';
import {
  Check,
  Zap,
  Sparkles,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';
import api from '../../../services/api.js';

export const HomePricing = () => {
  const [billingCycle, setBillingCycle] = useState('annual'); // 'monthly' or 'annual'
  const [plans, setPlans] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    api.get('/plans')
      .then((data) => {
        if (isMounted && Array.isArray(data)) {
          setPlans(data);
        }
      })
      .catch(() => {
        if (isMounted) setPlans([]);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section id="pricing" className="home-pricing-section">
      <div className="home-container">
        {/* Section Header */}
        <div className="home-section-header text-center">
          <div className="section-eyebrow">
            <Sparkles size={14} />
            <span>Transparent, Scalable Pricing</span>
          </div>
          <h2 className="section-title">
            Simple Plans That <span className="gradient-text">Pay For Themselves</span>
          </h2>
          <p className="section-description">
            No surprise add-ons. Every plan includes core workshop tools, thermal printing, and free automatic updates.
          </p>

          {/* Billing Switcher */}
          <div className="pricing-toggle-container">
            <span className={`toggle-label ${billingCycle === 'monthly' ? 'active' : ''}`}>
              Monthly Billing
            </span>
            <button
              type="button"
              className={`pricing-toggle-switch ${billingCycle === 'annual' ? 'switched' : ''}`}
              onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'annual' : 'monthly')}
              aria-label="Toggle annual or monthly billing"
            >
              <span className="toggle-thumb" />
            </button>
            <span className={`toggle-label ${billingCycle === 'annual' ? 'active' : ''}`}>
              Annual Billing
              <span className="save-badge">Save 20% (2 Months Free)</span>
            </span>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        {isLoading ? (
          <div className="pricing-cards-grid">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="pricing-card"
                style={{
                  minHeight: '400px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: 0.6,
                }}
              >
                <span>Loading plans...</span>
              </div>
            ))}
          </div>
        ) : plans.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
            <p>Custom workshop plans are currently being configured. Click below to sign up.</p>
            <Link href="/register" className="btn btn-primary">
              <span>Register Workshop</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        ) : (
          <div className="pricing-cards-grid">
            {plans.map((plan) => {
              const monthly = Number(plan.price) || 0;
              const annual = plan.yearlyPrice > 0 ? Number(plan.yearlyPrice) : Math.round(monthly * 0.8);
              const price = billingCycle === 'annual' ? annual : monthly;
              const isPopular = Boolean(plan.isPopular);
              const staffLimit = plan.limitUsers === -1 || plan.limitUsers === 'Unlimited' ? 'Unlimited' : `Up to ${plan.limitUsers}`;
              const techLimit = plan.limitTechs === -1 || plan.limitTechs === 'Unlimited' ? 'Unlimited' : `Up to ${plan.limitTechs}`;

              return (
                <div
                  key={plan._id || plan.name}
                  className={`pricing-card ${isPopular ? 'pricing-card-popular' : ''}`}
                >
                  {isPopular && (
                    <div className="popular-ribbon">
                      <Zap size={13} />
                      <span>RECOMMENDED BY 80% OF WORKSHOPS</span>
                    </div>
                  )}

                  <div className="pricing-card-header">
                    <span className="plan-badge-pill">{plan.badge || (isPopular ? 'Most Popular' : 'Workshop Tier')}</span>
                    <h3 className="plan-name">{plan.name}</h3>
                    <p className="plan-desc">{plan.description || 'Full workshop management tools and thermal POS billing.'}</p>
                  </div>

                  <div className="pricing-price-box">
                    <div className="price-row">
                      <span className="currency font-mono">₹</span>
                      <span className="amount font-mono">{price.toLocaleString('en-IN')}</span>
                      <span className="period">/ month</span>
                    </div>
                    <span className="billing-subtext">
                      {billingCycle === 'annual' ? 'Billed annually (tax inclusive)' : 'Billed monthly'}
                    </span>
                  </div>

                  <Link
                    href={`/register?plan=${encodeURIComponent(plan.name)}`}
                    className={`btn btn-full ${
                      isPopular ? 'btn-primary btn-lg' : 'btn-outline'
                    } pricing-cta-btn`}
                  >
                    <span>Start 14-Day Free Trial</span>
                    <ArrowRight size={16} />
                  </Link>

                  <div className="pricing-features-divider" />

                  <div className="pricing-features-list">
                    <span className="features-list-title">Everything included:</span>
                    <div className="plan-feature-item">
                      <Check size={16} className="text-emerald-500 flex-shrink-0" />
                      <span>{staffLimit} Staff Accounts</span>
                    </div>
                    <div className="plan-feature-item">
                      <Check size={16} className="text-emerald-500 flex-shrink-0" />
                      <span>{techLimit} Technician Seats</span>
                    </div>
                    {(Array.isArray(plan.features) ? plan.features : []).map((feat, idx) => (
                      <div key={idx} className="plan-feature-item">
                        <Check size={16} className="text-emerald-500 flex-shrink-0" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Guarantee Banner */}
        <div className="pricing-guarantee-box">
          <ShieldCheck size={28} className="text-blue-500 flex-shrink-0" />
          <div>
            <h4>14-Day Free Trial • Zero Risk Guarantee</h4>
            <p>
              Test Zapate Service Manager in your live shop for 14 days. If it doesn't noticeably accelerate your repairs and billing,
              cancel anytime with one click.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
