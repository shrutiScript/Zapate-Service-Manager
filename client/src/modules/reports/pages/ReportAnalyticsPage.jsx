import React, { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { MainLayout } from '../../../components/layout/MainLayout.jsx';
import { KpiCards } from '../../../components/ui/KpiCard/index.js';
import { formatCurrency } from '../../../utils/formatters.js';
import { Download, TrendingUp, DollarSign, Wrench, BarChart2, Inbox, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../../services/api.js';

export const ReportAnalyticsPage = () => {
  const [analytics, setAnalytics] = useState({
    weeklyRevenue: 0,
    completedRepairs: 0,
    avgJobValue: 0,
    dailyBreakdown: [],
    categories: [],
    hasData: false,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api.get('/reports/analytics')
      .then((data) => {
        if (data && typeof data === 'object') {
          setAnalytics({
            weeklyRevenue: data.weeklyRevenue || 0,
            completedRepairs: data.completedRepairs || 0,
            avgJobValue: data.avgJobValue || 0,
            dailyBreakdown: Array.isArray(data.dailyBreakdown) ? data.dailyBreakdown : [],
            categories: Array.isArray(data.categories) ? data.categories : [],
            hasData: Boolean(data.hasData && (data.weeklyRevenue > 0 || data.totalRepairsCount > 0 || data.totalInvoicesCount > 0)),
          });
        }
      })
      .catch(() => {
        setAnalytics({
          weeklyRevenue: 0,
          completedRepairs: 0,
          avgJobValue: 0,
          dailyBreakdown: [],
          categories: [],
          hasData: false,
        });
      })
      .finally(() => setIsLoading(false));
  }, []);

  const handleExportCsv = () => {
    if (!analytics.hasData) return;
    const headers = ['Metric/Category,Value,Details\n'];
    const rows = [
      `Weekly Revenue,${analytics.weeklyRevenue},Last 7 Days\n`,
      `Completed Repairs,${analytics.completedRepairs},Units\n`,
      `Average Job Value,${analytics.avgJobValue},Per Job\n`,
    ];
    (analytics.dailyBreakdown || []).forEach((d) => {
      rows.push(`Daily Revenue - ${d.day},${d.val},Day Total\n`);
    });
    (analytics.categories || []).forEach((c) => {
      rows.push(`Category - ${c.name},${c.amount},${c.share}\n`);
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + headers.concat(rows).join('');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `financial_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Financial Statement CSV downloaded!');
  };

  const maxVal = Math.max(...((analytics?.dailyBreakdown || []).map((b) => b?.val || 0)), 1);

  return (
    <MainLayout title="Reports & Analytics" subtitle="Financial Performance">
      <div className="page-header">
        <div className="page-header-info">
          <div className="page-badge-eyebrow">
            <span /> REVENUE INTELLIGENCE
          </div>
          <h1>Turnaround & Profit Reports</h1>
          <p>Weekly revenue velocity, top service repair lines, and workshop financial KPIs.</p>
        </div>
        {analytics.hasData && (
          <button
            className="btn btn-secondary"
            type="button"
            onClick={handleExportCsv}
          >
            <Download size={15} /> Export CSV Statement
          </button>
        )}
      </div>

      {/* KPI Highlights */}
      <KpiCards
        columns={3}
        items={[
          {
            icon: <TrendingUp size={22} />,
            label: 'Weekly Revenue',
            value: formatCurrency(analytics.weeklyRevenue),
            color: 'blue',
            accent: true,
            delta: analytics.weeklyRevenue > 0 ? 'Active' : undefined,
            deltaColor: '#2563eb',
            sub: 'last 7-day cycle',
          },
          {
            icon: <Wrench size={22} />,
            label: 'Completed Repair Jobs',
            value: analytics.completedRepairs,
            color: 'emerald',
            accent: true,
            delta: analytics.completedRepairs > 0 ? 'Active' : undefined,
            deltaColor: '#059669',
            sub: 'completed workshop fixes',
          },
          {
            icon: <DollarSign size={22} />,
            label: 'Average Job Value',
            value: formatCurrency(analytics.avgJobValue),
            color: 'purple',
            accent: true,
            delta: analytics.avgJobValue > 0 ? 'Active' : undefined,
            deltaColor: '#7c3aed',
            sub: 'per serviced handset',
          },
        ]}
      />

      {!analytics.hasData && !isLoading ? (
        <div className="card" style={{ textAlign: 'center', padding: '64px 20px' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: '#eff6ff',
              color: '#2563eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            <BarChart2 size={28} />
          </div>
          <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', marginBottom: '6px' }}>
            No business data available yet
          </h3>
          <p style={{ fontSize: '14px', color: '#64748b', maxWidth: '460px', margin: '0 auto 20px', lineHeight: 1.5 }}>
            Reports and analytics will automatically appear after you create repair jobs, invoices, payments, sales, and inventory transactions.
          </p>
          <Link href="/dashboard">
            <button type="button" className="btn btn-primary">
              Go to Dashboard <ArrowRight size={15} />
            </button>
          </Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '20px', alignItems: 'start' }}>
          {/* Weekly Revenue Bar Chart */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '16px', borderBottom: '1px solid var(--border-color)' }}>
              <div>
                <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Weekly Run Rate</span>
                <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>Revenue Trajectory (Last 7 Days)</h3>
              </div>
            </div>

            <div
              style={{
                height: '240px',
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'space-between',
                gap: '12px',
                padding: '24px 10px 10px',
              }}
            >
              {analytics.dailyBreakdown.map((b, idx) => {
                const heightPercent = maxVal > 0 && b.val > 0 ? `${Math.max(Math.round((b.val / maxVal) * 100), 8)}%` : '4px';
                return (
                  <div
                    key={idx}
                    style={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '8px',
                      height: '100%',
                      justifyContent: 'flex-end',
                    }}
                  >
                    <span style={{ fontSize: '10px', fontWeight: '700', color: '#64748b' }}>
                      {b.val > 0 ? formatCurrency(b.val) : '—'}
                    </span>
                    <div
                      style={{
                        width: '100%',
                        height: heightPercent,
                        background: b.val > 0 ? 'linear-gradient(180deg, #2563eb 0%, #3b82f6 100%)' : '#e2e8f0',
                        borderRadius: '6px 6px 0 0',
                        transition: 'all 0.3s ease',
                      }}
                    />
                    <span style={{ fontSize: '11px', fontWeight: '700', color: '#475569' }}>{b.day}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Category Breakdown */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '16px', borderBottom: '1px solid var(--border-color)' }}>
              <div>
                <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Service Category Mix</span>
                <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>Revenue by Repair Type</h3>
              </div>
            </div>

            {analytics.categories.length === 0 ? (
              <div style={{ padding: '32px 16px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
                No repair categories recorded yet.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '16px' }}>
                {analytics.categories.map((c, idx) => (
                  <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                      <strong style={{ color: '#0f172a' }}>{c.name}</strong>
                      <span style={{ fontWeight: '700', color: '#2563eb' }}>{formatCurrency(c.amount)} ({c.share})</span>
                    </div>
                    <div style={{ width: '100%', height: '6px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: c.share, height: '100%', background: '#2563eb', borderRadius: '4px' }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </MainLayout>
  );
};
