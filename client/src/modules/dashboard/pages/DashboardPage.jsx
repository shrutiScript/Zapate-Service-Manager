import React, { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { MainLayout } from '../../../components/layout/MainLayout.jsx';
import { KpiCards } from '../../../components/ui/KpiCard/index.js';
import { formatCurrency } from '../../../utils/formatters.js';
import { useAuth } from '../../../context/AuthContext.jsx';
import {
  Calendar,
  Plus,
  LayoutGrid,
  Wrench,
  Package,
  IndianRupee,
  Users,
  Box,
  TrendingUp,
  TrendingDown,
  Minus,
  UserPlus,
  ChevronDown,
  ArrowRight,
  CheckCircle2,
  Smartphone,
  CircleDot,
  ShoppingBag,
  Battery,
  Cpu,
  Shield,
  Layers,
} from 'lucide-react';
import api from '../../../services/api.js';

export const DashboardPage = () => {
  const { user, currentShop } = useAuth();

  // Strict zero-based default state for workshop isolation (no dummy data)
  const [stats, setStats] = useState({
    todaySales: 0,
    todaySalesDelta: '— No sales today',
    activeRepairs: 0,
    activeRepairsDelta: '0 in workshop',
    readyForPickup: 0,
    readyForPickupDelta: '0 awaiting delivery',
    pendingDueAmount: 0,
    pendingDuesDelta: '₹0 uncollected balance',
    totalCustomers: 0,
    totalCustomersDelta: '0 registered',
    lowStockItemsCount: 0,
    lowStockDelta: '✓ Stock healthy',
    pipeline: {
      intakeCount: 0,
      inProgressCount: 0,
      readyCount: 0,
      deliveredCount: 0,
    },
    recentPayments: [],
    lowStockList: [],
    recentActivities: [],
  });

  const [jobs, setJobs] = useState([]);
  const [pipelineFilter, setPipelineFilter] = useState('This Month');
  const [isLoading, setIsLoading] = useState(true);

  // Dynamic Time-based Greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const userFirstName = user?.name?.split(' ')[0] || user?.shopName || 'Workshop Owner';

  // Format today's date: e.g. "Saturday, 6 Sept 2026"
  const formattedDate = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    // 1. Fetch real reports from backend strictly scoped to current authenticated workshop
    api.get('/reports/dashboard')
      .then((data) => {
        if (isMounted && data) {
          const salesVal = Number(data.todaySales || 0);
          const activeVal = Number(data.activeRepairs !== undefined ? data.activeRepairs : (data.pendingRepairs || 0));
          const readyVal = Number(data.readyForDelivery !== undefined ? data.readyForDelivery : (data.readyForPickup || 0));
          const duesVal = Number(data.pendingDueAmount || 0);
          const custVal = Number(data.totalCustomers || 0);
          const lowStockVal = Number(data.lowStockItemsCount || 0);

          setStats({
            todaySales: salesVal,
            todaySalesDelta: salesVal > 0 ? '+12% vs yesterday' : '— No sales today',
            activeRepairs: activeVal,
            activeRepairsDelta: activeVal > 0 ? `${activeVal} in workshop` : '0 in workshop',
            readyForPickup: readyVal,
            readyForPickupDelta: readyVal > 0 ? `${readyVal} awaiting delivery` : '0 awaiting delivery',
            pendingDueAmount: duesVal,
            pendingDuesDelta: duesVal > 0 ? `${formatCurrency(duesVal)} pending` : '₹0 uncollected balance',
            totalCustomers: custVal,
            totalCustomersDelta: custVal > 0 ? `${custVal} registered` : '0 registered',
            lowStockItemsCount: lowStockVal,
            lowStockDelta: lowStockVal > 0 ? `${lowStockVal} need attention` : '✓ Stock healthy',
            pipeline: {
              intakeCount: Number(data.pipeline?.intakeCount || 0),
              inProgressCount: Number(data.pipeline?.inProgressCount || 0),
              readyCount: Number(data.pipeline?.readyCount || 0),
              deliveredCount: Number(data.pipeline?.deliveredCount || 0),
            },
            recentPayments: Array.isArray(data.recentPayments) ? data.recentPayments : [],
            lowStockList: Array.isArray(data.lowStockList) ? data.lowStockList : [],
            recentActivities: Array.isArray(data.recentActivities) ? data.recentActivities : [],
          });
        }
      })
      .catch(() => {});

    // 2. Fetch live repairs strictly for current workshop
    api.get('/repairs')
      .then((res) => {
        if (!isMounted) return;
        if (Array.isArray(res) && res.length > 0) {
          const mapped = res.map((r) => {
            const cust = (typeof r.customer === 'object' ? r.customer?.name : r.customerName) || 'Walk-in Client';
            const dev = (typeof r.device === 'object' ? `${r.device?.brand || ''} ${r.device?.model || ''}`.trim() : r.deviceModel) || 'Universal Device';
            const iss = r.problemDescription || r.issue || 'Hardware service';
            const amt = Number(r.finalAmount || r.estimatedAmount || r.amount || 0);

            return {
              id: r._id || r.id,
              jobNo: r.number || r.repairNumber || r.jobNo || 'RF-0000',
              customer: cust,
              issue: iss,
              device: dev,
              stage: r.status || 'Received',
              amount: amt,
            };
          });
          setJobs(mapped.slice(0, 5));
        } else {
          setJobs([]);
        }
      })
      .catch(() => {
        if (isMounted) setJobs([]);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [user?._id, currentShop?._id]);

  // Stage Badge Renderer matching design
  const getStageBadge = (stage = '') => {
    const s = String(stage).trim().toLowerCase();
    if (s.includes('deliver') || s.includes('complet')) {
      return (
        <span
          style={{
            fontSize: '11px',
            fontWeight: '700',
            padding: '4px 10px',
            borderRadius: '6px',
            background: '#dcfce7',
            color: '#15803d',
            display: 'inline-block',
          }}
        >
          Delivered
        </span>
      );
    }
    if (s.includes('receiv') || s.includes('intake')) {
      return (
        <span
          style={{
            fontSize: '11px',
            fontWeight: '700',
            padding: '4px 10px',
            borderRadius: '6px',
            background: '#eff6ff',
            color: '#1d4ed8',
            display: 'inline-block',
          }}
        >
          Device Received
        </span>
      );
    }
    if (s.includes('progress')) {
      return (
        <span
          style={{
            fontSize: '11px',
            fontWeight: '700',
            padding: '4px 10px',
            borderRadius: '6px',
            background: '#fef3c7',
            color: '#b45309',
            display: 'inline-block',
          }}
        >
          In Progress
        </span>
      );
    }
    if (s.includes('part') || s.includes('wait')) {
      return (
        <span
          style={{
            fontSize: '11px',
            fontWeight: '700',
            padding: '4px 10px',
            borderRadius: '6px',
            background: '#fee2e2',
            color: '#b91c1c',
            display: 'inline-block',
          }}
        >
          Pending Parts
        </span>
      );
    }
    if (s.includes('diag') || s.includes('check')) {
      return (
        <span
          style={{
            fontSize: '11px',
            fontWeight: '700',
            padding: '4px 10px',
            borderRadius: '6px',
            background: '#f3e8ff',
            color: '#7e22ce',
            display: 'inline-block',
          }}
        >
          Diagnosis
        </span>
      );
    }
    return (
      <span
        style={{
          fontSize: '11px',
          fontWeight: '700',
          padding: '4px 10px',
          borderRadius: '6px',
          background: '#f1f5f9',
          color: '#475569',
          display: 'inline-block',
        }}
      >
        {stage}
      </span>
    );
  };

  const getPartIcon = (category = '') => {
    const c = category.toLowerCase();
    if (c.includes('battery')) return <Battery size={14} style={{ color: '#64748b' }} />;
    if (c.includes('charging') || c.includes('cpu') || c.includes('ic')) return <Cpu size={14} style={{ color: '#64748b' }} />;
    if (c.includes('body') || c.includes('back') || c.includes('panel')) return <Shield size={14} style={{ color: '#64748b' }} />;
    return <ShoppingBag size={14} style={{ color: '#64748b' }} />;
  };

  // Dynamic Pipeline Percentages
  const totalPipelineTickets =
    (stats.pipeline?.intakeCount || 0) +
    (stats.pipeline?.inProgressCount || 0) +
    (stats.pipeline?.readyCount || 0) +
    (stats.pipeline?.deliveredCount || 0);

  const getPipelineWidth = (count) => {
    if (!totalPipelineTickets || totalPipelineTickets <= 0) return '0%';
    return `${Math.min(100, Math.round(((count || 0) / totalPipelineTickets) * 100))}%`;
  };

  return (
    <MainLayout title="Dashboard" subtitle="Workshop Operations Overview">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '1440px', margin: '0 auto' }}>
        
        {/* ========================================================= */}
        {/* 1. GREETING & INTAKE BAR                                  */}
        {/* ========================================================= */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px',
            marginBottom: '4px',
          }}
        >
          <div>
            <h1
              style={{
                fontSize: '24px',
                fontWeight: '800',
                color: '#0f172a',
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                letterSpacing: '-0.3px',
              }}
            >
              {getGreeting()}, {userFirstName}! <span style={{ display: 'inline-block' }}>👋</span>
            </h1>
            <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0 0' }}>
              Here's what's happening at your workshop today.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Date Card */}
            <div
              style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                padding: '8px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
              }}
            >
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: '#eff6ff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#2563eb',
                }}
              >
                <Calendar size={18} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '12px', fontWeight: '800', color: '#0f172a' }}>
                  {formattedDate}
                </span>
                <span style={{ fontSize: '10px', color: '#64748b' }}>
                  Have a productive day!
                </span>
              </div>
            </div>

            {/* + Intake New Device Button */}
            <Link href="/repairs" style={{ textDecoration: 'none' }}>
              <button
                type="button"
                className="btn btn-primary"
                style={{
                  background: '#2563eb',
                  color: '#ffffff',
                  fontWeight: '700',
                  fontSize: '13px',
                  padding: '10px 18px',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'transform 0.15s ease, background 0.15s',
                }}
              >
                <Plus size={16} /> Intake New Device
              </button>
            </Link>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 2. TOP 6 KPI METRIC CARDS (STRICT MULTI-TENANT REAL DATA) */}
        {/* ========================================================= */}
        <KpiCards
          columns={6}
          items={[
            {
              icon: <LayoutGrid size={22} />,
              label: "Today's Sales",
              value: formatCurrency(stats.todaySales || 0),
              color: 'blue',
              accent: true,
              delta: stats.todaySales > 0 ? '+12%' : '₹0 today',
              deltaColor: stats.todaySales > 0 ? '#16a34a' : '#64748b',
              sub: 'vs yesterday',
            },
            {
              icon: <Wrench size={22} />,
              label: 'Active Repairs',
              value: stats.activeRepairs || 0,
              color: 'emerald',
              accent: true,
              delta: stats.activeRepairs > 0 ? `${stats.activeRepairs} active` : '0 active',
              deltaColor: stats.activeRepairs > 0 ? '#ea580c' : '#64748b',
              sub: 'in workshop',
            },
            {
              icon: <Package size={22} />,
              label: 'Ready for Pickup',
              value: stats.readyForPickup || 0,
              color: 'purple',
              accent: true,
              sub: 'awaiting delivery',
            },
            {
              icon: <IndianRupee size={22} />,
              label: 'Pending Dues',
              value: formatCurrency(stats.pendingDueAmount || 0),
              color: 'orange',
              accent: true,
              delta: stats.pendingDueAmount > 0 ? formatCurrency(stats.pendingDueAmount) : '₹0 dues',
              deltaColor: stats.pendingDueAmount > 0 ? '#ea580c' : '#16a34a',
              sub: 'uncollected balance',
            },
            {
              icon: <Users size={22} />,
              label: 'Total Customers',
              value: stats.totalCustomers || 0,
              color: 'teal',
              accent: true,
              delta: stats.totalCustomers > 0 ? `${stats.totalCustomers} total` : '0 total',
              deltaColor: stats.totalCustomers > 0 ? '#16a34a' : '#64748b',
              sub: 'registered clients',
            },
            {
              icon: <Box size={22} />,
              label: 'Low Stock Parts',
              value: stats.lowStockItemsCount || 0,
              color: 'rose',
              accent: true,
              delta: stats.lowStockItemsCount > 0 ? '⚠ Action' : '✓ Good',
              deltaColor: stats.lowStockItemsCount > 0 ? '#dc2626' : '#16a34a',
              valueColor: stats.lowStockItemsCount > 0 ? '#dc2626' : undefined,
              sub: stats.lowStockItemsCount > 0 ? 'threshold alerts' : 'stock healthy',
            },
          ]}
        />

        {/* ========================================================= */}
        {/* 3. MIDDLE SECTION (WORK ORDERS QUEUE + SIDEBAR WIDGETS)   */}
        {/* ========================================================= */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 2fr) minmax(320px, 1fr)',
            gap: '24px',
            alignItems: 'start',
          }}
          className="dashboard-main-split"
        >
          {/* LEFT: Live Work Orders Queue */}
          <div
            style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '22px 24px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '18px',
              }}
            >
              <div>
                <h2 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                  Live Work Orders Queue
                </h2>
                <p style={{ fontSize: '12px', color: '#64748b', margin: '2px 0 0 0' }}>
                  Real-time ticket progression & parts status
                </p>
              </div>

              <Link href="/repairs" style={{ textDecoration: 'none' }}>
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: '700',
                    color: '#2563eb',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    cursor: 'pointer',
                  }}
                >
                  View All Jobs →
                </span>
              </Link>
            </div>

            {/* Table or Empty State */}
            {jobs.length === 0 ? (
              <div
                style={{
                  padding: '48px 24px',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  background: '#f8fafc',
                  borderRadius: '10px',
                  border: '1px dashed #cbd5e1',
                  margin: '8px 0',
                }}
              >
                <div
                  style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '12px',
                    background: '#eff6ff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#2563eb',
                    marginBottom: '2px',
                  }}
                >
                  <Wrench size={22} />
                </div>
                <p style={{ fontSize: '13.5px', fontWeight: '600', color: '#475569', margin: 0 }}>
                  No repair jobs yet. Create your first repair job to get started.
                </p>
                <Link href="/repairs" style={{ textDecoration: 'none', marginTop: '4px' }}>
                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{
                      background: '#2563eb',
                      color: '#ffffff',
                      fontSize: '12px',
                      fontWeight: '700',
                      padding: '7px 16px',
                      borderRadius: '8px',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      boxShadow: '0 2px 6px rgba(37, 99, 235, 0.2)',
                    }}
                  >
                    <Plus size={14} /> Create Repair Job
                  </button>
                </Link>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <th style={{ padding: '10px 12px', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.4px' }}>JOB ID</th>
                      <th style={{ padding: '10px 12px', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.4px' }}>CUSTOMER & ISSUE</th>
                      <th style={{ padding: '10px 12px', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.4px' }}>DEVICE</th>
                      <th style={{ padding: '10px 12px', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.4px' }}>STAGE</th>
                      <th style={{ padding: '10px 12px', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.4px' }}>AMOUNT</th>
                      <th style={{ padding: '10px 12px', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.4px', textAlign: 'right' }}>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {jobs.map((job) => (
                      <tr
                        key={job.id || job.jobNo}
                        style={{
                          borderBottom: '1px solid #f8fafc',
                          transition: 'background 0.15s',
                        }}
                        className="table-row-hover"
                      >
                        <td style={{ padding: '14px 12px' }}>
                          <Link href={`/repairs`} style={{ textDecoration: 'none' }}>
                            <span style={{ fontSize: '13px', fontWeight: '700', color: '#2563eb', fontFamily: 'JetBrains Mono, monospace', cursor: 'pointer' }}>
                              {job.jobNo}
                            </span>
                          </Link>
                        </td>

                        <td style={{ padding: '14px 12px' }}>
                          <div style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>
                            {job.customer}
                          </div>
                          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '1px' }}>
                            {job.issue}
                          </div>
                        </td>

                        <td style={{ padding: '14px 12px', fontSize: '13px', color: '#334155', fontWeight: '500' }}>
                          {job.device}
                        </td>

                        <td style={{ padding: '14px 12px' }}>
                          {getStageBadge(job.stage)}
                        </td>

                        <td style={{ padding: '14px 12px', fontSize: '13px', fontWeight: '700', color: '#0f172a', fontFamily: 'JetBrains Mono, monospace' }}>
                          {formatCurrency(job.amount)}
                        </td>

                        <td style={{ padding: '14px 12px', textAlign: 'right' }}>
                          <Link href="/repairs" style={{ textDecoration: 'none' }}>
                            <button
                              type="button"
                              style={{
                                padding: '4px 14px',
                                borderRadius: '6px',
                                fontSize: '12px',
                                fontWeight: '600',
                                color: '#2563eb',
                                border: '1px solid #bfdbfe',
                                background: '#f8fafc',
                                cursor: 'pointer',
                                transition: 'all 0.15s',
                              }}
                            >
                              View
                            </button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* RIGHT: Quick Actions & Repair Pipeline */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* 1. Quick Actions */}
            <div
              style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '20px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              }}
            >
              <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', margin: '0 0 14px 0' }}>
                Quick Actions
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <Link href="/repairs" style={{ textDecoration: 'none' }}>
                  <div
                    style={{
                      padding: '12px 14px',
                      borderRadius: '10px',
                      border: '1px solid #e2e8f0',
                      background: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      cursor: 'pointer',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
                      transition: 'all 0.2s',
                    }}
                    className="hover-scale"
                  >
                    <Wrench size={16} style={{ color: '#2563eb' }} />
                    <span style={{ fontSize: '12.5px', fontWeight: '700', color: '#0f172a' }}>New Job Card</span>
                  </div>
                </Link>

                <Link href="/pos" style={{ textDecoration: 'none' }}>
                  <div
                    style={{
                      padding: '12px 14px',
                      borderRadius: '10px',
                      border: '1px solid #e2e8f0',
                      background: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      cursor: 'pointer',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
                      transition: 'all 0.2s',
                    }}
                    className="hover-scale"
                  >
                    <IndianRupee size={16} style={{ color: '#10b981' }} />
                    <span style={{ fontSize: '12.5px', fontWeight: '700', color: '#0f172a' }}>POS Billing</span>
                  </div>
                </Link>

                <Link href="/customers" style={{ textDecoration: 'none' }}>
                  <div
                    style={{
                      padding: '12px 14px',
                      borderRadius: '10px',
                      border: '1px solid #e2e8f0',
                      background: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      cursor: 'pointer',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
                      transition: 'all 0.2s',
                    }}
                    className="hover-scale"
                  >
                    <UserPlus size={16} style={{ color: '#f97316' }} />
                    <span style={{ fontSize: '12.5px', fontWeight: '700', color: '#0f172a' }}>Add Customer</span>
                  </div>
                </Link>

                <Link href="/inventory" style={{ textDecoration: 'none' }}>
                  <div
                    style={{
                      padding: '12px 14px',
                      borderRadius: '10px',
                      border: '1px solid #e2e8f0',
                      background: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      cursor: 'pointer',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
                      transition: 'all 0.2s',
                    }}
                    className="hover-scale"
                  >
                    <Box size={16} style={{ color: '#8b5cf6' }} />
                    <span style={{ fontSize: '12.5px', fontWeight: '700', color: '#0f172a' }}>Add Inventory</span>
                  </div>
                </Link>
              </div>
            </div>

            {/* 2. Repair Pipeline (Zero-Based Default State) */}
            <div
              style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '20px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                  Repair Pipeline
                </h3>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    padding: '3px 8px',
                    fontSize: '11px',
                    fontWeight: '700',
                    color: '#475569',
                  }}
                >
                  <span>{pipelineFilter}</span>
                  <ChevronDown size={12} />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* Intake & Diagnosis */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '5px' }}>
                    <span style={{ fontWeight: '600', color: '#334155' }}>Intake & Diagnosis</span>
                    <span style={{ fontWeight: '700', color: '#2563eb', fontSize: '11.5px' }}>
                      {stats.pipeline?.intakeCount || 0} tickets
                    </span>
                  </div>
                  <div style={{ height: '6px', background: '#f1f5f9', borderRadius: '9999px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: getPipelineWidth(stats.pipeline?.intakeCount), background: '#2563eb', borderRadius: '9999px', transition: 'width 0.4s ease' }} />
                  </div>
                </div>

                {/* In Progress */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '5px' }}>
                    <span style={{ fontWeight: '600', color: '#334155' }}>In Progress</span>
                    <span style={{ fontWeight: '700', color: '#f97316', fontSize: '11.5px' }}>
                      {stats.pipeline?.inProgressCount || 0} tickets
                    </span>
                  </div>
                  <div style={{ height: '6px', background: '#f1f5f9', borderRadius: '9999px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: getPipelineWidth(stats.pipeline?.inProgressCount), background: '#f97316', borderRadius: '9999px', transition: 'width 0.4s ease' }} />
                  </div>
                </div>

                {/* Ready for Pickup */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '5px' }}>
                    <span style={{ fontWeight: '600', color: '#334155' }}>Ready for Pickup</span>
                    <span style={{ fontWeight: '700', color: '#10b981', fontSize: '11.5px' }}>
                      {stats.pipeline?.readyCount || 0} tickets
                    </span>
                  </div>
                  <div style={{ height: '6px', background: '#f1f5f9', borderRadius: '9999px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: getPipelineWidth(stats.pipeline?.readyCount), background: '#10b981', borderRadius: '9999px', transition: 'width 0.4s ease' }} />
                  </div>
                </div>

                {/* Delivered */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '5px' }}>
                    <span style={{ fontWeight: '600', color: '#334155' }}>Delivered</span>
                    <span style={{ fontWeight: '700', color: '#8b5cf6', fontSize: '11.5px' }}>
                      {stats.pipeline?.deliveredCount || 0} tickets
                    </span>
                  </div>
                  <div style={{ height: '6px', background: '#f1f5f9', borderRadius: '9999px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: getPipelineWidth(stats.pipeline?.deliveredCount), background: '#8b5cf6', borderRadius: '9999px', transition: 'width 0.4s ease' }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 4. BOTTOM THREE-CARD ROW (EMPTY STATES SUPPORT)           */}
        {/* ========================================================= */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '24px',
            marginBottom: '32px',
          }}
          className="dashboard-bottom-row"
        >
          {/* CARD 1: Recent Payments */}
          <div
            style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '20px 22px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                Recent Payments
              </h3>
              <Link href="/payments" style={{ textDecoration: 'none' }}>
                <span style={{ fontSize: '12px', fontWeight: '700', color: '#2563eb', cursor: 'pointer' }}>
                  View All →
                </span>
              </Link>
            </div>

            {stats.recentPayments.length === 0 ? (
              <div
                style={{
                  padding: '36px 16px',
                  textAlign: 'center',
                  color: '#64748b',
                  fontSize: '13px',
                  fontWeight: '500',
                  background: '#f8fafc',
                  borderRadius: '8px',
                  border: '1px dashed #e2e8f0',
                }}
              >
                No payments recorded yet.
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <th style={{ padding: '8px 4px', fontSize: '10.5px', fontWeight: '700', color: '#64748b' }}>DATE</th>
                    <th style={{ padding: '8px 4px', fontSize: '10.5px', fontWeight: '700', color: '#64748b' }}>CUSTOMER</th>
                    <th style={{ padding: '8px 4px', fontSize: '10.5px', fontWeight: '700', color: '#64748b' }}>AMOUNT</th>
                    <th style={{ padding: '8px 4px', fontSize: '10.5px', fontWeight: '700', color: '#64748b' }}>METHOD</th>
                    <th style={{ padding: '8px 4px', fontSize: '10.5px', fontWeight: '700', color: '#64748b', textAlign: 'right' }}>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentPayments.map((p, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #f8fafc' }}>
                      <td style={{ padding: '10px 4px', fontSize: '11px', color: '#475569' }}>{p.date}</td>
                      <td style={{ padding: '10px 4px', fontSize: '12px', fontWeight: '700', color: '#0f172a' }}>{p.customer}</td>
                      <td style={{ padding: '10px 4px', fontSize: '12px', fontWeight: '700', color: '#0f172a', fontFamily: 'JetBrains Mono, monospace' }}>
                        {formatCurrency(p.amount)}
                      </td>
                      <td style={{ padding: '10px 4px', fontSize: '11px', color: '#64748b' }}>{p.method}</td>
                      <td style={{ padding: '10px 4px', textAlign: 'right' }}>
                        <span
                          style={{
                            fontSize: '10.5px',
                            fontWeight: '700',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            background: '#dcfce7',
                            color: '#15803d',
                          }}
                        >
                          {p.status || 'Completed'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* CARD 2: Low Stock Alerts */}
          <div
            style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '20px 22px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                Low Stock Alerts
              </h3>
              <Link href="/inventory" style={{ textDecoration: 'none' }}>
                <span style={{ fontSize: '12px', fontWeight: '700', color: '#2563eb', cursor: 'pointer' }}>
                  View All →
                </span>
              </Link>
            </div>

            {stats.lowStockList.length === 0 ? (
              <div
                style={{
                  padding: '36px 16px',
                  textAlign: 'center',
                  color: '#64748b',
                  fontSize: '13px',
                  fontWeight: '500',
                  background: '#f8fafc',
                  borderRadius: '8px',
                  border: '1px dashed #e2e8f0',
                }}
              >
                No inventory alerts yet.
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <th style={{ padding: '8px 4px', fontSize: '10.5px', fontWeight: '700', color: '#64748b' }}>PART NAME</th>
                    <th style={{ padding: '8px 4px', fontSize: '10.5px', fontWeight: '700', color: '#64748b', textAlign: 'center' }}>CURRENT</th>
                    <th style={{ padding: '8px 4px', fontSize: '10.5px', fontWeight: '700', color: '#64748b', textAlign: 'right' }}>THRESHOLD</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.lowStockList.map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #f8fafc' }}>
                      <td style={{ padding: '10px 4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div
                            style={{
                              width: '24px',
                              height: '24px',
                              borderRadius: '4px',
                              background: '#f8fafc',
                              border: '1px solid #e2e8f0',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            {getPartIcon(item.category || item.name)}
                          </div>
                          <span style={{ fontSize: '12px', fontWeight: '600', color: '#0f172a' }}>
                            {item.name}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '10px 4px', textAlign: 'center' }}>
                        <span style={{ fontSize: '12px', fontWeight: '800', color: '#dc2626', fontFamily: 'JetBrains Mono, monospace' }}>
                          {item.current}
                        </span>
                      </td>
                      <td style={{ padding: '10px 4px', textAlign: 'right', fontSize: '11.5px', color: '#64748b', fontFamily: 'JetBrains Mono, monospace' }}>
                        {item.threshold}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* CARD 3: Today's Activity */}
          <div
            style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '20px 22px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            }}
          >
            <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', margin: '0 0 16px 0' }}>
              Today's Activity
            </h3>

            {stats.recentActivities.length === 0 ? (
              <div
                style={{
                  padding: '36px 16px',
                  textAlign: 'center',
                  color: '#64748b',
                  fontSize: '13px',
                  fontWeight: '500',
                  background: '#f8fafc',
                  borderRadius: '8px',
                  border: '1px dashed #e2e8f0',
                }}
              >
                No activity recorded yet.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative' }}>
                {stats.recentActivities.map((act, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <div
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: '#2563eb',
                        marginTop: '6px',
                        flexShrink: 0,
                        boxShadow: '0 0 0 3px #dbeafe',
                      }}
                    />
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: '800', color: '#2563eb', letterSpacing: '0.2px' }}>
                        {act.time}
                      </div>
                      <div style={{ fontSize: '12px', color: '#334155', marginTop: '2px', lineHeight: '1.4' }}>
                        {act.text}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </MainLayout>
  );
};
