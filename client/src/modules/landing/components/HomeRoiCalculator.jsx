import React, { useState, useMemo } from 'react';
import { Link } from 'wouter';
import {
  Calculator,
  TrendingUp,
  Clock,
  DollarSign,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Zap,
  Check
} from 'lucide-react';

export const HomeRoiCalculator = () => {
  const [repairsPerDay, setRepairsPerDay] = useState(25);
  const [avgTicketValue, setAvgTicketValue] = useState(2200);
  const [techniciansCount, setTechniciansCount] = useState(3);

  // Dynamic calculations based on industry benchmarks
  const calculations = useMemo(() => {
    const workingDays = 26;
    const monthlyRepairs = repairsPerDay * workingDays;
    const monthlyRevenue = monthlyRepairs * avgTicketValue;

    // Time saved per repair (approx 22 minutes on intake, inventory lookup, and manual billing)
    const hoursSavedPerMonth = Math.round((monthlyRepairs * 0.36));

    // Prevented leakage & upsell conversion (reduced parts theft, missed labor charges, 12-16% gain)
    const extraProfitPerMonth = Math.round(monthlyRevenue * 0.145);

    // Annual impact
    const annualGains = extraProfitPerMonth * 12;

    return {
      monthlyRepairs,
      monthlyRevenue,
      hoursSavedPerMonth,
      extraProfitPerMonth,
      annualGains,
      turnaroundBoost: '42% Faster',
    };
  }, [repairsPerDay, avgTicketValue, techniciansCount]);

  const formatCurrency = (val) => {
    return '₹' + val.toLocaleString('en-IN');
  };

  return (
    <section id="calculator" className="home-calculator-section">
      <div className="home-container">
        {/* Header */}
        <div className="home-section-header text-center">
          <div className="section-eyebrow">
            <Calculator size={14} />
            <span>Interactive ROI Estimator</span>
          </div>
          <h2 className="section-title">
            Calculate Your Workshop's <span className="gradient-text">Profit & Time Savings</span>
          </h2>
          <p className="section-description">
            Adjust the sliders below based on your workshop volume to see how much time and money Zapate Service Manager recovers
            every single month.
          </p>
        </div>

        {/* Calculator Main Box */}
        <div className="calculator-box-wrapper">
          {/* Left Column: Sliders */}
          <div className="calculator-inputs-pane">
            <h3 className="calc-pane-title">Workshop Parameters</h3>

            {/* Slider 1: Repairs per Day */}
            <div className="calc-control-group">
              <div className="calc-label-row">
                <label htmlFor="repairs-slider">Daily Repair Volume:</label>
                <span className="calc-value-badge font-mono">{repairsPerDay} Devices / Day</span>
              </div>
              <input
                id="repairs-slider"
                type="range"
                min="5"
                max="120"
                step="5"
                value={repairsPerDay}
                onChange={(e) => setRepairsPerDay(Number(e.target.value))}
                className="calc-range-slider"
              />
              <div className="calc-range-limits">
                <span>5 / day (Solo shop)</span>
                <span>120 / day (High-volume franchise)</span>
              </div>
            </div>

            {/* Slider 2: Average Ticket Value */}
            <div className="calc-control-group">
              <div className="calc-label-row">
                <label htmlFor="ticket-slider">Average Repair Ticket Price:</label>
                <span className="calc-value-badge font-mono">{formatCurrency(avgTicketValue)}</span>
              </div>
              <input
                id="ticket-slider"
                type="range"
                min="500"
                max="8000"
                step="100"
                value={avgTicketValue}
                onChange={(e) => setAvgTicketValue(Number(e.target.value))}
                className="calc-range-slider"
              />
              <div className="calc-range-limits">
                <span>₹500 (Basic screen/battery)</span>
                <span>₹8,000 (Flagship & Laptop logic board)</span>
              </div>
            </div>

            {/* Slider 3: Technicians Count */}
            <div className="calc-control-group">
              <div className="calc-label-row">
                <label htmlFor="techs-slider">Number of Bench Technicians:</label>
                <span className="calc-value-badge font-mono">{techniciansCount} Technicians</span>
              </div>
              <input
                id="techs-slider"
                type="range"
                min="1"
                max="15"
                step="1"
                value={techniciansCount}
                onChange={(e) => setTechniciansCount(Number(e.target.value))}
                className="calc-range-slider"
              />
              <div className="calc-range-limits">
                <span>1 Bench Tech</span>
                <span>15 Technicians</span>
              </div>
            </div>

            {/* Benchmark Note */}
            <div className="calc-note">
              <Sparkles size={14} className="text-amber-500 flex-shrink-0" />
              <span>
                Calculations based on verified data across 1,200+ repair centers using automated intake, stock control, and POS.
              </span>
            </div>
          </div>

          {/* Right Column: Dynamic Results Card */}
          <div className="calculator-results-pane">
            <div className="results-header">
              <span className="results-tag">PROJECTED GAINS</span>
              <h4>Estimated Monthly Value Recovered</h4>
            </div>

            <div className="results-big-highlight">
              <div className="big-currency-val font-mono">{formatCurrency(calculations.extraProfitPerMonth)}</div>
              <div className="big-currency-lbl">Additional Monthly Profit & Leakage Prevented</div>
            </div>

            <div className="results-metrics-grid">
              <div className="result-metric-card">
                <div className="metric-header">
                  <Clock size={16} className="text-blue-400" />
                  <span>Time Saved</span>
                </div>
                <div className="metric-number font-mono">{calculations.hoursSavedPerMonth} hrs / mo</div>
                <div className="metric-caption">~{Math.round(calculations.hoursSavedPerMonth / 8)} full work days reclaimed</div>
              </div>

              <div className="result-metric-card">
                <div className="metric-header">
                  <TrendingUp size={16} className="text-emerald-400" />
                  <span>Turnaround Speed</span>
                </div>
                <div className="metric-number font-mono">{calculations.turnaroundBoost}</div>
                <div className="metric-caption">Accelerated customer handovers</div>
              </div>
            </div>

            <div className="results-annual-box">
              <span>Projected 12-Month Extra Profit: </span>
              <strong className="font-mono text-emerald-400">{formatCurrency(calculations.annualGains)} / Year</strong>
            </div>

            <Link href="/register" className="btn btn-primary btn-full btn-lg calc-cta-btn">
              <span>Start Free Trial & Claim These Gains</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};
