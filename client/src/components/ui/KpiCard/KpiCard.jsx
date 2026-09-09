/**
 * KpiCard — Global Reusable Summary / KPI Card Component
 *
 * Renders a horizontal metric card with:
 *   - Colored icon box on the left
 *   - Uppercase label above
 *   - Large bold value below
 *   - Optional subtle accent border on the left edge
 *   - Consistent sizing, padding, and shadow
 *
 * Usage:
 *   <KpiCard
 *     icon={<Wrench size={22} />}
 *     label="Live Queue"
 *     value={7}
 *     color="blue"           // 'blue' | 'orange' | 'purple' | 'green' | 'red' | 'teal'
 *     accent                 // optional: adds a left accent border strip
 *     valueColor             // optional: override value text color (e.g. '#dc2626')
 *   />
 *
 *   <KpiCards items={[...]} />   ← renders a responsive grid of KpiCard components
 */

import React from 'react';

/* ─── Semantic colour tokens ─────────────────────────── */
const PALETTE = {
  blue:    { iconBg: '#eff6ff', iconColor: '#2563eb', border: '#2563eb' },
  orange:  { iconBg: '#fff7ed', iconColor: '#ea580c', border: '#ea580c' },
  purple:  { iconBg: '#faf5ff', iconColor: '#7c3aed', border: '#7c3aed' },
  green:   { iconBg: '#f0fdf4', iconColor: '#16a34a', border: '#16a34a' },
  emerald: { iconBg: '#ecfdf5', iconColor: '#059669', border: '#059669' },
  red:     { iconBg: '#fff1f2', iconColor: '#dc2626', border: '#dc2626' },
  rose:    { iconBg: '#fff1f2', iconColor: '#e11d48', border: '#e11d48' },
  teal:    { iconBg: '#f0fdfa', iconColor: '#0d9488', border: '#0d9488' },
  amber:   { iconBg: '#fffbeb', iconColor: '#d97706', border: '#d97706' },
  yellow:  { iconBg: '#fefce8', iconColor: '#ca8a04', border: '#ca8a04' },
  indigo:  { iconBg: '#eef2ff', iconColor: '#4f46e5', border: '#4f46e5' },
  slate:   { iconBg: '#f8fafc', iconColor: '#475569', border: '#64748b' },
};

/* ─── Single KPI Card ────────────────────────────────── */
export function KpiCard({
  icon,
  label,
  value,
  color = 'blue',
  accent = false,
  valueColor,
  sub,
  delta,
  deltaColor,
  onClick,
  className = '',
  style = {},
}) {
  const palette = PALETTE[color] || PALETTE.blue;

  return (
    <div
      onClick={onClick}
      className={`kpi-card-unified ${className}`}
      style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderLeft: accent ? `3.5px solid ${palette.border}` : '1px solid #e2e8f0',
        borderRadius: '12px',
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        boxShadow: '0 1px 4px rgba(0, 0, 0, 0.04)',
        minHeight: '82px',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
        ...style,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.07)';
        e.currentTarget.style.transform = 'translateY(-1px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = '0 1px 4px rgba(0, 0, 0, 0.04)';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      {/* Icon Box */}
      <div
        style={{
          width: '44px',
          height: '44px',
          borderRadius: '11px',
          background: palette.iconBg,
          color: palette.iconColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {icon}
      </div>

      {/* Content */}
      <div style={{ minWidth: 0, flex: 1, overflow: 'hidden' }}>
        <span
          style={{
            display: 'block',
            fontSize: '10.5px',
            fontWeight: '700',
            color: '#64748b',
            textTransform: 'uppercase',
            letterSpacing: '0.6px',
            marginBottom: '3px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {label}
        </span>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', flexWrap: 'nowrap' }}>
          <div
            style={{
              fontSize: '22px',
              fontWeight: '800',
              color: valueColor || '#0f172a',
              lineHeight: 1.15,
              letterSpacing: '-0.5px',
              whiteSpace: 'nowrap',
            }}
          >
            {value ?? '—'}
          </div>
          {delta && (
            <span
              style={{
                fontSize: '11px',
                fontWeight: '700',
                color: deltaColor || '#16a34a',
                whiteSpace: 'nowrap',
              }}
            >
              {delta}
            </span>
          )}
        </div>
        {sub && (
          <div
            style={{
              fontSize: '11px',
              color: '#94a3b8',
              fontWeight: '500',
              marginTop: '3px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {sub}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── KpiCards Grid Wrapper ──────────────────────────── */
export function KpiCards({ items = [], columns, style = {} }) {
  const gridStyle = columns
    ? { gridTemplateColumns: `repeat(${columns}, 1fr)` }
    : { gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))' };

  return (
    <div
      style={{
        display: 'grid',
        ...gridStyle,
        gap: '16px',
        marginBottom: '24px',
        ...style,
      }}
    >
      {items.map((item, i) => (
        <KpiCard key={i} {...item} />
      ))}
    </div>
  );
}

