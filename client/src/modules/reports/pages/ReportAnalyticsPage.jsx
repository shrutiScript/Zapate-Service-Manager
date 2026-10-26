import React, { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { MainLayout } from '../../../components/layout/MainLayout.jsx';
import { KpiCards } from '../../../components/ui/KpiCard/index.js';
import { formatCurrency } from '../../../utils/formatters.js';
import {
  Download,
  TrendingUp,
  DollarSign,
  Wrench,
  BarChart2,
  Receipt,
  CreditCard,
  CheckCircle2,
  Clock,
  Printer,
  PieChart,
  ArrowRight,
  ShieldCheck,
  Calendar,
  Layers,
} from 'lucide-react';
import { toast } from 'sonner';
import api from '../../../services/api.js';

export const ReportAnalyticsPage = () => {
  const [range, setRange] = useState('all');
  const [activeTab, setActiveTab] = useState('overview');
  const [analytics, setAnalytics] = useState({
    totalRevenue: 0,
    totalCollected: 0,
    totalDue: 0,
    completedRepairs: 0,
    avgJobValue: 0,
    totalRepairsCount: 0,
    totalInvoicesCount: 0,
    dailyBreakdown: [],
    categories: [],
    paymentMethods: [],
    repairStatuses: [],
    recentTransactions: [],
    allTime: null,
    hasData: false,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    api.get(`/reports/analytics?range=${range}`)
      .then((data) => {
        if (data && typeof data === 'object') {
          setAnalytics({
            totalRevenue: data.totalRevenue ?? data.weeklyRevenue ?? 0,
            totalCollected: data.totalCollected ?? 0,
            totalDue: data.totalDue ?? 0,
            completedRepairs: data.completedRepairs ?? 0,
            avgJobValue: data.avgJobValue ?? 0,
            totalRepairsCount: data.totalRepairsCount ?? 0,
            totalInvoicesCount: data.totalInvoicesCount ?? 0,
            dailyBreakdown: Array.isArray(data.dailyBreakdown) ? data.dailyBreakdown : [],
            categories: Array.isArray(data.categories) ? data.categories : [],
            paymentMethods: Array.isArray(data.paymentMethods) ? data.paymentMethods : [],
            repairStatuses: Array.isArray(data.repairStatuses) ? data.repairStatuses : [],
            recentTransactions: Array.isArray(data.recentTransactions) ? data.recentTransactions : [],
            allTime: data.allTime || null,
            hasData: Boolean(data.hasData),
          });
        }
      })
      .catch(() => {
        toast.error('Unable to fetch latest analytics report');
      })
      .finally(() => setIsLoading(false));
  }, [range]);

  const handleExportCsv = () => {
    if (!analytics.hasData) return;
    const headers = ['Category/Type,Details,Amount,Count\n'];
    const rows = [
      `Summary,Total Revenue,${analytics.totalRevenue},${analytics.totalInvoicesCount} invoices\n`,
      `Summary,Collected Amount,${analytics.totalCollected},-\n`,
      `Summary,Outstanding Due,${analytics.totalDue},-\n`,
      `Summary,Completed Repairs,${analytics.completedRepairs},Jobs\n`,
      `Summary,Average Ticket Size,${analytics.avgJobValue},-\n`,
    ];

    (analytics.dailyBreakdown || []).forEach((d) => {
      rows.push(`Timeline Revenue,${d.day},${d.val},${d.count || 0} jobs\n`);
    });
    (analytics.categories || []).forEach((c) => {
      rows.push(`Service Category,${c.name},${c.amount},${c.count} repairs\n`);
    });
    (analytics.paymentMethods || []).forEach((m) => {
      rows.push(`Payment Mode,${m.name},${m.amount},${m.share}\n`);
    });
    (analytics.recentTransactions || []).forEach((t) => {
      rows.push(`Invoice,${t.number} (${t.customerName}),${t.amount},${t.paymentMethod}\n`);
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + headers.concat(rows).join('');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `financial_report_${range}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Financial Statement CSV downloaded!');
  };

  const handlePrint = () => {
    window.print();
  };

  const maxDailyVal = Math.max(...((analytics?.dailyBreakdown || []).map((b) => b?.val || 0)), 1);

  return (
    <MainLayout title="Reports & Analytics" subtitle="Turnaround & Profit Intelligence">
      {/* Page Header */}
      <div className="page-header" style={{ flexWrap: 'wrap', gap: '16px', alignItems: 'flex-start' }}>
        <div className="page-header-info">
          <div className="page-badge-eyebrow">
            <span /> REVENUE INTELLIGENCE
          </div>
          <h1>Turnaround & Profit Reports</h1>
          <p>Financial velocity, service margins, payment modes, and workshop turnaround analytics.</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Time Range Selector */}
          <div
            style={{
              display: 'inline-flex',
              background: '#f1f5f9',
              padding: '4px',
              borderRadius: '10px',
              border: '1px solid #e2e8f0',
            }}
          >
            {[
              { id: 'all', label: 'All Time' },
              { id: '90d', label: '90 Days' },
              { id: '30d', label: '30 Days' },
              { id: '7d', label: '7 Days' },
              { id: 'today', label: 'Today' },
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setRange(p.id)}
                style={{
                  border: 'none',
                  background: range === p.id ? '#ffffff' : 'transparent',
                  color: range === p.id ? '#1e293b' : '#64748b',
                  fontWeight: range === p.id ? '700' : '500',
                  padding: '6px 14px',
                  borderRadius: '7px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  boxShadow: range === p.id ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Action Buttons */}
          <button
            className="btn btn-secondary"
            type="button"
            onClick={handlePrint}
            title="Print statement"
            style={{ padding: '8px 14px', fontSize: '13px' }}
          >
            <Printer size={15} /> Print
          </button>

          {analytics.hasData && (
            <button
              className="btn btn-primary"
              type="button"
              onClick={handleExportCsv}
              style={{ padding: '8px 14px', fontSize: '13px' }}
            >
              <Download size={15} /> Export CSV
            </button>
          )}
        </div>
      </div>

      {/* KPI Highlights (4 Columns) */}
      <KpiCards
        columns={4}
        items={[
          {
            icon: <TrendingUp size={22} />,
            label: 'Total Revenue',
            value: formatCurrency(analytics.totalRevenue),
            color: 'blue',
            accent: true,
            delta: analytics.totalInvoicesCount > 0 ? `${analytics.totalInvoicesCount} Invoices` : undefined,
            deltaColor: '#2563eb',
            sub: `${formatCurrency(analytics.totalCollected)} collected`,
          },
          {
            icon: <Wrench size={22} />,
            label: 'Completed Repairs',
            value: analytics.completedRepairs,
            color: 'emerald',
            accent: true,
            delta: analytics.totalRepairsCount > 0 ? `${analytics.totalRepairsCount} Total Jobs` : undefined,
            deltaColor: '#059669',
            sub: 'delivered fixes',
          },
          {
            icon: <DollarSign size={22} />,
            label: 'Average Ticket Size',
            value: formatCurrency(analytics.avgJobValue),
            color: 'purple',
            accent: true,
            delta: 'Per Job',
            deltaColor: '#7c3aed',
            sub: 'average repair value',
          },
          {
            icon: <CreditCard size={22} />,
            label: 'Outstanding Due',
            value: formatCurrency(analytics.totalDue),
            color: analytics.totalDue > 0 ? 'amber' : 'emerald',
            accent: true,
            delta: analytics.totalDue === 0 ? 'Fully Paid' : 'Pending',
            deltaColor: analytics.totalDue === 0 ? '#059669' : '#d97706',
            sub: `${formatCurrency(analytics.totalCollected)} settled`,
          },
        ]}
      />

      {/* When absolutely no data exists across the workshop */}
      {!analytics.hasData && !isLoading ? (
        <div className="card" style={{ textAlign: 'center', padding: '64px 20px', marginTop: '20px' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '20px',
              background: '#eff6ff',
              color: '#2563eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            <BarChart2 size={32} />
          </div>
          <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', marginBottom: '6px' }}>
            No business data logged yet
          </h3>
          <p style={{ fontSize: '14px', color: '#64748b', maxWidth: '460px', margin: '0 auto 20px', lineHeight: 1.5 }}>
            Create repair jobs, generate POS invoices, or record customer payments to view real-time intelligence reports here.
          </p>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
            <Link href="/repairs">
              <button type="button" className="btn btn-primary">
                New Repair Job <ArrowRight size={15} />
              </button>
            </Link>
            <Link href="/pos">
              <button type="button" className="btn btn-secondary">
                Quick POS Sale
              </button>
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* Section Navigation Tabs */}
          <div
            style={{
              display: 'flex',
              gap: '8px',
              margin: '24px 0 16px',
              borderBottom: '1px solid #e2e8f0',
              paddingBottom: '8px',
              overflowX: 'auto',
            }}
          >
            {[
              { id: 'overview', label: 'Revenue & Performance', icon: BarChart2 },
              { id: 'repairs', label: 'Repair Turnaround & Status', icon: Wrench },
              { id: 'payments', label: 'Payment Modes & Cashflow', icon: CreditCard },
              { id: 'invoices', label: 'Recent Transactions Ledger', icon: Receipt },
            ].map((tab) => {
              const TabIcon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    background: isActive ? '#2563eb' : 'transparent',
                    color: isActive ? '#ffffff' : '#64748b',
                    fontWeight: isActive ? '700' : '600',
                    fontSize: '13px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <TabIcon size={15} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* TAB 1: OVERVIEW & PERFORMANCE */}
          {activeTab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '20px', alignItems: 'stretch' }}>
                {/* Revenue Trajectory Chart */}
                <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      paddingBottom: '14px',
                      borderBottom: '1px solid var(--border-color)',
                    }}
                  >
                    <div>
                      <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>
                        Financial Velocity
                      </span>
                      <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: '2px 0 0' }}>
                        Revenue Trajectory ({range === 'all' ? 'All Time' : range.toUpperCase()})
                      </h3>
                    </div>
                    <span
                      style={{
                        fontSize: '13px',
                        fontWeight: '800',
                        color: '#2563eb',
                        background: '#eff6ff',
                        padding: '4px 10px',
                        borderRadius: '6px',
                      }}
                    >
                      {formatCurrency(analytics.totalRevenue)}
                    </span>
                  </div>

                  <div
                    style={{
                      minHeight: '260px',
                      display: 'flex',
                      alignItems: 'flex-end',
                      justifyContent: 'space-between',
                      gap: '12px',
                      padding: '24px 10px 10px',
                      flex: 1,
                    }}
                  >
                    {analytics.dailyBreakdown.length === 0 ? (
                      <div style={{ width: '100%', textAlign: 'center', color: '#94a3b8', padding: '60px 0' }}>
                        No billing dates recorded in this range.
                      </div>
                    ) : (
                      analytics.dailyBreakdown.map((b, idx) => {
                        const heightPercent =
                          maxDailyVal > 0 && b.val > 0
                            ? `${Math.max(Math.round((b.val / maxDailyVal) * 100), 12)}%`
                            : '6px';
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
                            <span style={{ fontSize: '10px', fontWeight: '700', color: b.val > 0 ? '#1e293b' : '#94a3b8' }}>
                              {b.val > 0 ? formatCurrency(b.val) : '—'}
                            </span>
                            <div
                              style={{
                                width: '100%',
                                height: heightPercent,
                                background:
                                  b.val > 0
                                    ? 'linear-gradient(180deg, #2563eb 0%, #3b82f6 100%)'
                                    : '#e2e8f0',
                                borderRadius: '6px 6px 0 0',
                                transition: 'all 0.3s ease',
                                boxShadow: b.val > 0 ? '0 4px 10px rgba(37,99,235,0.25)' : 'none',
                              }}
                              title={`${b.day}: ${formatCurrency(b.val)}`}
                            />
                            <span style={{ fontSize: '11px', fontWeight: '700', color: '#475569', whiteSpace: 'nowrap' }}>
                              {b.day}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Service Category Mix */}
                <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      paddingBottom: '14px',
                      borderBottom: '1px solid var(--border-color)',
                    }}
                  >
                    <div>
                      <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>
                        Service Mix
                      </span>
                      <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: '2px 0 0' }}>
                        Revenue by Repair Issue
                      </h3>
                    </div>
                  </div>

                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    {analytics.categories.length === 0 ? (
                      <div style={{ padding: '40px 16px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
                        No specific issue categories categorized yet.
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '16px 0' }}>
                        {analytics.categories.map((c, idx) => (
                          <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                              <strong style={{ color: '#0f172a', textTransform: 'capitalize' }}>{c.name}</strong>
                              <span style={{ fontWeight: '700', color: '#2563eb' }}>
                                {formatCurrency(c.amount)} ({c.share})
                              </span>
                            </div>
                            <div
                              style={{
                                width: '100%',
                                height: '8px',
                                background: '#f1f5f9',
                                borderRadius: '4px',
                                overflow: 'hidden',
                              }}
                            >
                              <div
                                style={{
                                  width: c.share,
                                  height: '100%',
                                  background: 'linear-gradient(90deg, #2563eb 0%, #3b82f6 100%)',
                                  borderRadius: '4px',
                                }}
                              />
                            </div>
                            <span style={{ fontSize: '11px', color: '#64748b' }}>
                              {c.count} service {c.count === 1 ? 'ticket' : 'tickets'} logged
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Quick Transaction Overview */}
              <div className="card">
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '16px',
                  }}
                >
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                      Recent Billing Transactions
                    </h3>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>
                      Latest client invoices, POS sales, and payment collections
                    </span>
                  </div>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ fontSize: '12px', padding: '6px 12px' }}
                    onClick={() => setActiveTab('invoices')}
                  >
                    View All Invoices <ArrowRight size={13} />
                  </button>
                </div>

                <div className="table-container">
                  <table className="pro-table">
                    <thead>
                      <tr>
                        <th>Invoice #</th>
                        <th>Customer</th>
                        <th>Service / Device</th>
                        <th>Date</th>
                        <th>Payment Mode</th>
                        <th>Amount</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.recentTransactions.length === 0 ? (
                        <tr>
                          <td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: '#94a3b8' }}>
                            No invoice records logged.
                          </td>
                        </tr>
                      ) : (
                        analytics.recentTransactions.slice(0, 5).map((t) => (
                          <tr key={t.id}>
                            <td>
                              <strong style={{ color: '#2563eb' }}>{t.number}</strong>
                            </td>
                            <td>{t.customerName}</td>
                            <td>{t.device}</td>
                            <td>{new Date(t.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                            <td>
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  fontSize: '11px',
                                  fontWeight: '700',
                                  background: t.paymentMethod === 'UPI' ? '#eff6ff' : '#f0fdf4',
                                  color: t.paymentMethod === 'UPI' ? '#2563eb' : '#16a34a',
                                  padding: '3px 8px',
                                  borderRadius: '6px',
                                }}
                              >
                                {t.paymentMethod}
                              </span>
                            </td>
                            <td>
                              <strong style={{ color: '#0f172a' }}>{formatCurrency(t.amount)}</strong>
                            </td>
                            <td>
                              <span
                                style={{
                                  fontSize: '11px',
                                  fontWeight: '700',
                                  color: t.dueAmount > 0 ? '#d97706' : '#16a34a',
                                  background: t.dueAmount > 0 ? '#fffbeb' : '#dcfce7',
                                  padding: '3px 8px',
                                  borderRadius: '6px',
                                }}
                              >
                                {t.dueAmount > 0 ? `Due: ${formatCurrency(t.dueAmount)}` : 'Paid'}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: REPAIR TURNAROUND & STATUS */}
          {activeTab === 'repairs' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }}>
              <div className="card">
                <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', marginBottom: '14px' }}>
                  Repair Ticket Pipeline Distribution
                </h3>
                {analytics.repairStatuses.length === 0 ? (
                  <div style={{ padding: '32px', textAlign: 'center', color: '#94a3b8' }}>
                    No repair tickets found.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {analytics.repairStatuses.map((s, idx) => (
                      <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                          <span style={{ fontWeight: '700', color: '#1e293b' }}>{s.status}</span>
                          <span style={{ fontWeight: '800', color: '#2563eb' }}>
                            {s.count} {s.count === 1 ? 'Job' : 'Jobs'} ({s.share})
                          </span>
                        </div>
                        <div style={{ width: '100%', height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                          <div
                            style={{
                              width: s.share,
                              height: '100%',
                              background:
                                s.status === 'Delivered' || s.status === 'Completed'
                                  ? '#10b981'
                                  : s.status === 'Device Received'
                                  ? '#3b82f6'
                                  : '#f59e0b',
                              borderRadius: '4px',
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                  Turnaround KPIs
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '10px' }}>
                    <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748b' }}>TOTAL LOGGED TICKETS</span>
                    <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', margin: '4px 0 0' }}>
                      {analytics.totalRepairsCount}
                    </h2>
                  </div>
                  <div style={{ background: '#f0fdf4', padding: '14px', borderRadius: '10px' }}>
                    <span style={{ fontSize: '11px', fontWeight: '700', color: '#16a34a' }}>COMPLETED & DELIVERED</span>
                    <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#15803d', margin: '4px 0 0' }}>
                      {analytics.completedRepairs}
                    </h2>
                  </div>
                  <div style={{ background: '#eff6ff', padding: '14px', borderRadius: '10px' }}>
                    <span style={{ fontSize: '11px', fontWeight: '700', color: '#2563eb' }}>AVG SERVICE TICKET CHARGE</span>
                    <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#1d4ed8', margin: '4px 0 0' }}>
                      {formatCurrency(analytics.avgJobValue)}
                    </h2>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PAYMENT MODES & CASHFLOW */}
          {activeTab === 'payments' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }}>
              <div className="card">
                <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', marginBottom: '16px' }}>
                  Payment Method Distribution
                </h3>
                {analytics.paymentMethods.length === 0 ? (
                  <div style={{ padding: '32px', textAlign: 'center', color: '#94a3b8' }}>
                    No payment modes recorded yet.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {analytics.paymentMethods.map((m, idx) => (
                      <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                          <span style={{ fontWeight: '700', color: '#1e293b' }}>{m.name}</span>
                          <span style={{ fontWeight: '800', color: '#2563eb' }}>
                            {formatCurrency(m.amount)} ({m.share})
                          </span>
                        </div>
                        <div style={{ width: '100%', height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                          <div
                            style={{
                              width: m.share,
                              height: '100%',
                              background: m.name === 'UPI' ? '#2563eb' : '#16a34a',
                              borderRadius: '4px',
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                  Settlement & Cashflow
                </h3>
                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px' }}>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748b' }}>TOTAL INVOICED REVENUE</span>
                  <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', margin: '4px 0 0' }}>
                    {formatCurrency(analytics.totalRevenue)}
                  </h2>
                </div>
                <div style={{ background: '#f0fdf4', padding: '16px', borderRadius: '10px' }}>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#16a34a' }}>TOTAL REALIZED / COLLECTED</span>
                  <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#15803d', margin: '4px 0 0' }}>
                    {formatCurrency(analytics.totalCollected)}
                  </h2>
                </div>
                <div style={{ background: '#fffbeb', padding: '16px', borderRadius: '10px' }}>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#d97706' }}>PENDING UNPAID DUES</span>
                  <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#b45309', margin: '4px 0 0' }}>
                    {formatCurrency(analytics.totalDue)}
                  </h2>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: RECENT BILLING & INVOICES */}
          {activeTab === 'invoices' && (
            <div className="card">
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '16px',
                }}
              >
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                    Invoices & Sales Transactions Ledger
                  </h3>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>
                    All repair service invoices and itemized client sales
                  </span>
                </div>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleExportCsv}
                  style={{ fontSize: '12px', padding: '6px 12px' }}
                >
                  <Download size={13} /> Export Ledger
                </button>
              </div>

              <div className="table-container">
                <table className="pro-table">
                  <thead>
                    <tr>
                      <th>Invoice #</th>
                      <th>Customer</th>
                      <th>Device / Service</th>
                      <th>Issue / Item</th>
                      <th>Payment Mode</th>
                      <th>Total Amount</th>
                      <th>Collected</th>
                      <th>Due</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.recentTransactions.length === 0 ? (
                      <tr>
                        <td colSpan={9} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                          No invoice records found in this range.
                        </td>
                      </tr>
                    ) : (
                      analytics.recentTransactions.map((t) => (
                        <tr key={t.id}>
                          <td>
                            <strong style={{ color: '#2563eb' }}>{t.number}</strong>
                          </td>
                          <td>{t.customerName}</td>
                          <td>{t.device}</td>
                          <td>Repair & Services</td>
                          <td>
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '11px',
                                fontWeight: '700',
                                background: t.paymentMethod === 'UPI' ? '#eff6ff' : '#f0fdf4',
                                color: t.paymentMethod === 'UPI' ? '#2563eb' : '#16a34a',
                                padding: '3px 8px',
                                borderRadius: '6px',
                              }}
                            >
                              {t.paymentMethod}
                            </span>
                          </td>
                          <td>
                            <strong style={{ color: '#0f172a' }}>{formatCurrency(t.amount)}</strong>
                          </td>
                          <td>
                            <span style={{ color: '#16a34a', fontWeight: '700' }}>
                              {formatCurrency(t.paidAmount)}
                            </span>
                          </td>
                          <td>
                            <span style={{ color: t.dueAmount > 0 ? '#d97706' : '#64748b', fontWeight: '700' }}>
                              {formatCurrency(t.dueAmount)}
                            </span>
                          </td>
                          <td>
                            {new Date(t.date).toLocaleDateString('en-GB', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </MainLayout>
  );
};
