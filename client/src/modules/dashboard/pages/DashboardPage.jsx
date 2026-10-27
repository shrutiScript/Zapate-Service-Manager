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
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  CheckCircle2,
  Smartphone,
  Banknote,
  CreditCard,
  Clock,
  ShieldCheck,
  ShoppingBag,
  Battery,
  Cpu,
  Shield,
  ArrowUpRight,
  Check,
  AlertTriangle,
  Sparkles,
  RotateCcw,
} from 'lucide-react';
import api from '../../../services/api.js';
import { SubscriptionCountdownBar } from '../../../components/common/SubscriptionCountdownBar.jsx';
import './DashboardPage.css';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];
const WEEKDAY_NAMES = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export const DashboardPage = () => {
  const { user, currentShop, updateCurrentShop, refreshUser } = useAuth();

  // Helper to get local today date string YYYY-MM-DD
  const getTodayDateString = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Date selection & calendar popover state
  const [selectedDate, setSelectedDate] = useState(getTodayDateString);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const datePickerRef = React.useRef(null);

  // Month navigation in calendar popover
  const [viewYear, setViewYear] = useState(() => new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(() => new Date().getMonth());

  // Set of YYYY-MM-DD date strings that have relevant workshop records in database
  const [activeCalendarDates, setActiveCalendarDates] = useState(() => new Set());

  // Strict zero-based default state for workshop isolation
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

  // Close calendar popover on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target)) {
        setIsCalendarOpen(false);
      }
    };
    if (isCalendarOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isCalendarOpen]);

  // Synchronize viewYear/viewMonth when selectedDate changes
  useEffect(() => {
    if (selectedDate && /^\d{4}-\d{2}-\d{2}$/.test(selectedDate)) {
      const [y, m] = selectedDate.split('-').map(Number);
      setViewYear(y);
      setViewMonth(m - 1);
    }
  }, [selectedDate]);

  // Fetch real date availability with workshop records for the displayed month
  useEffect(() => {
    let isMounted = true;
    const tzOffset = new Date().getTimezoneOffset();

    api
      .get(`/reports/calendar-dates?year=${viewYear}&month=${viewMonth + 1}&timezoneOffset=${tzOffset}`)
      .then((res) => {
        if (!isMounted) return;
        const datesArray = Array.isArray(res?.activeDates)
          ? res.activeDates
          : Array.isArray(res?.data?.activeDates)
          ? res.data.activeDates
          : Array.isArray(res)
          ? res
          : [];
        setActiveCalendarDates(new Set(datesArray));
      })
      .catch((err) => {
        console.error('Failed to fetch calendar active dates:', err);
        if (isMounted) setActiveCalendarDates(new Set());
      });

    return () => {
      isMounted = false;
    };
  }, [viewYear, viewMonth, selectedDate]);

  const isToday = selectedDate === getTodayDateString();

  const [sYear, sMonth, sDay] = (selectedDate || getTodayDateString()).split('-').map(Number);
  const selectedDateObj = new Date(sYear, sMonth - 1, sDay);
  const formattedSelectedWeekday = selectedDateObj.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const formattedSelectedDDMMYYYY = `${String(sDay).padStart(2, '0')}/${String(sMonth).padStart(2, '0')}/${sYear}`;

  // Quick navigation: Previous / Next Date
  const stepDate = (days) => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    dt.setDate(dt.getDate() + days);
    const ny = dt.getFullYear();
    const nm = String(dt.getMonth() + 1).padStart(2, '0');
    const nd = String(dt.getDate()).padStart(2, '0');
    setSelectedDate(`${ny}-${nm}-${nd}`);
  };

  const jumpToToday = () => {
    const todayStr = getTodayDateString();
    setSelectedDate(todayStr);
    const now = new Date();
    setViewYear(now.getFullYear());
    setViewMonth(now.getMonth());
    setIsCalendarOpen(false);
  };

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  // Calendar days grid calculations
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay(); // 0 = Sun
  const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

  const prevMonthDays = [];
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    prevMonthDays.push(daysInPrevMonth - i);
  }

  const currentMonthDays = [];
  for (let i = 1; i <= daysInMonth; i++) {
    currentMonthDays.push(i);
  }

  const totalCells = prevMonthDays.length + currentMonthDays.length;
  const nextMonthDaysCount = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
  const nextMonthDays = [];
  for (let i = 1; i <= nextMonthDaysCount; i++) {
    nextMonthDays.push(i);
  }

  // Dynamic Time-based Greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const userFirstName = user?.name?.split(' ')[0] || user?.shopName || 'Workshop Owner';

  // Device brand/model deduplication helper (e.g. OnePlus + OnePlus 11R 5G -> OnePlus 11R 5G)
  const cleanDeviceName = (brand = '', model = '') => {
    const b = (brand || '').trim();
    const m = (model || '').trim();
    if (!b && !m) return 'Universal Device';
    if (!b) return m;
    if (!m) return b;
    if (m.toLowerCase().startsWith(b.toLowerCase())) {
      const remainder = m.slice(b.length).trim();
      return remainder ? `${b} ${remainder}` : b;
    }
    return `${b} ${m}`;
  };

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    const tzOffset = new Date().getTimezoneOffset();

    // 1. Fetch real reports from backend strictly scoped to current authenticated workshop & selected date
    const reportsReq = api.get(`/reports/dashboard?date=${selectedDate}&timezoneOffset=${tzOffset}`)
      .then((data) => {
        if (isMounted && data) {
          const salesVal = Number(data.dateSales !== undefined ? data.dateSales : (data.todaySales || 0));
          const activeVal = Number(data.dateRepairs !== undefined ? data.dateRepairs : (data.activeRepairs || 0));
          const readyVal = Number(data.readyForDelivery !== undefined ? data.readyForDelivery : (data.readyForPickup || 0));
          const duesVal = Number(data.pendingDueAmount || 0);
          const custVal = Number(data.dateCustomers !== undefined ? data.dateCustomers : (data.totalCustomers || 0));
          const lowStockVal = Number(data.lowStockItemsCount || 0);

          setStats({
            todaySales: salesVal,
            todaySalesDelta: salesVal > 0 ? `₹${salesVal.toLocaleString('en-IN')}` : 'No sales',
            activeRepairs: activeVal,
            activeRepairsDelta: activeVal > 0 ? `${activeVal} active` : '0 tickets',
            readyForPickup: readyVal,
            readyForPickupDelta: readyVal > 0 ? `${readyVal} ready` : 'None pending',
            pendingDueAmount: duesVal,
            pendingDuesDelta: duesVal > 0 ? 'Pending dues' : 'Settled',
            totalCustomers: custVal,
            totalCustomersDelta: custVal > 0 ? `${custVal} registered` : '0 new',
            allCustomersCount: Number(data.allCustomersCount || data.totalCustomers || 0),
            totalInventory: Number(data.totalInventory || 0),
            lowStockItemsCount: lowStockVal,
            lowStockDelta: lowStockVal > 0 ? `${lowStockVal} alerts` : '✓ Healthy',
            pipeline: {
              intakeCount: Number(data.pipeline?.intakeCount || 0),
              inProgressCount: Number(data.pipeline?.inProgressCount || 0),
              readyCount: Number(data.pipeline?.readyCount || 0),
              deliveredCount: Number(data.pipeline?.deliveredCount || 0),
            },
            recentPayments: Array.isArray(data.recentPayments) ? data.recentPayments : [],
            lowStockList: Array.isArray(data.lowStockList) ? data.lowStockList : [],
            recentActivities: Array.isArray(data.recentActivities) ? data.recentActivities : [],
            subscription: data.subscription,
            serverTime: data.serverTime,
          });
        }
      })
      .catch((err) => {
        console.error('Failed to load dashboard stats:', err);
      });

    // 2. Fetch live repairs strictly for current workshop & selected date
    const repairsReq = api.get(`/repairs?date=${selectedDate}&timezoneOffset=${tzOffset}`)
      .then((res) => {
        if (!isMounted) return;
        if (Array.isArray(res) && res.length > 0) {
          const mapped = res.map((r) => {
            const cust = (typeof r.customer === 'object' ? r.customer?.name : r.customerName) || 'Walk-in Client';
            const dev = cleanDeviceName(
              typeof r.device === 'object' ? r.device?.brand : '',
              typeof r.device === 'object' ? r.device?.model : r.deviceModel
            );
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
          setJobs(mapped.slice(0, 8));
        } else {
          setJobs([]);
        }
      })
      .catch(() => {
        if (isMounted) setJobs([]);
      });

    Promise.allSettled([reportsReq, repairsReq]).finally(() => {
      if (isMounted) setIsLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, [user?._id, currentShop?._id, selectedDate]);

  // Stage Badge Renderer
  const getStageBadge = (stage = '') => {
    const s = String(stage).trim().toLowerCase();
    if (s.includes('deliver') || s.includes('complet')) {
      return (
        <span className="dashboard-status-badge badge-delivered">
          <span className="badge-dot" />
          Delivered
        </span>
      );
    }
    if (s.includes('ready')) {
      return (
        <span className="dashboard-status-badge badge-ready">
          <span className="badge-dot" />
          Ready for Pickup
        </span>
      );
    }
    if (s.includes('progress') || s.includes('repair')) {
      return (
        <span className="dashboard-status-badge badge-progress">
          <span className="badge-dot" />
          In Progress
        </span>
      );
    }
    if (s.includes('part') || s.includes('wait')) {
      return (
        <span className="dashboard-status-badge badge-parts">
          <span className="badge-dot" />
          Pending Parts
        </span>
      );
    }
    if (s.includes('diag') || s.includes('check')) {
      return (
        <span className="dashboard-status-badge badge-diagnosis">
          <span className="badge-dot" />
          Diagnosis
        </span>
      );
    }
    return (
      <span className="dashboard-status-badge badge-received">
        <span className="badge-dot" />
        {stage || 'Received'}
      </span>
    );
  };

  // Payment Method Badge Renderer
  const getPaymentMethodBadge = (method = '') => {
    const m = String(method).toUpperCase();
    if (m.includes('UPI')) {
      return (
        <span className="payment-method-pill pill-upi">
          <Smartphone size={11} /> UPI
        </span>
      );
    }
    if (m.includes('CASH')) {
      return (
        <span className="payment-method-pill pill-cash">
          <Banknote size={11} /> Cash
        </span>
      );
    }
    if (m.includes('CARD')) {
      return (
        <span className="payment-method-pill pill-card">
          <CreditCard size={11} /> Card
        </span>
      );
    }
    return (
      <span className="payment-method-pill pill-default">
        {method || 'Online'}
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
      <div className="dashboard-container">

        {/* ========================================================= */}
        {/* 1. GREETING & INTAKE BAR                                  */}
        {/* ========================================================= */}
        <div className="dashboard-header-bar">
          <div className="dashboard-title-group">
            <h1>
              {getGreeting()}, {userFirstName}! <span>👋</span>
            </h1>
            <p>
              Here's what's happening at your workshop today.
            </p>
          </div>

          <div className="dashboard-header-actions">
            {/* Date Selector Group */}
            <div className="dashboard-date-selector-wrapper" ref={datePickerRef}>
              <div className="dashboard-date-control-group">
                <button
                  type="button"
                  className="dashboard-date-nav-btn prev-btn"
                  onClick={() => stepDate(-1)}
                  title="Previous Day"
                  aria-label="Previous day"
                >
                  <ChevronLeft size={16} />
                </button>

                <div
                  className={`dashboard-date-chip ${isCalendarOpen ? 'is-calendar-open' : ''}`}
                  onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      setIsCalendarOpen(!isCalendarOpen);
                    }
                  }}
                  title="Click to open calendar"
                >
                  <div className="dashboard-date-icon">
                    <Calendar size={17} />
                  </div>
                  <div className="dashboard-date-info">
                    <div className="dashboard-date-primary-row">
                      <span className="dashboard-date-primary">{formattedSelectedWeekday}</span>
                      <ChevronDown
                        size={13}
                        className={`dashboard-date-chevron ${isCalendarOpen ? 'is-rotated' : ''}`}
                      />
                    </div>
                    <div className="dashboard-date-secondary-row">
                      <span className="dashboard-date-ddmmyyyy">{formattedSelectedDDMMYYYY}</span>
                      {isToday ? (
                        <span className="dashboard-date-badge today-badge">Today</span>
                      ) : (
                        <span className="dashboard-date-badge filtered-badge">Filtered</span>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  className="dashboard-date-nav-btn next-btn"
                  onClick={() => stepDate(1)}
                  title="Next Day"
                  aria-label="Next day"
                >
                  <ChevronRight size={16} />
                </button>
              </div>

              {/* Interactive Calendar Popover */}
              {isCalendarOpen && (
                <div className="dashboard-calendar-popover" role="dialog" aria-modal="true">
                  <div className="calendar-popover-header">
                    <button
                      type="button"
                      className="calendar-nav-btn"
                      onClick={handlePrevMonth}
                      title="Previous Month"
                    >
                      <ChevronLeft size={15} />
                    </button>
                    <span className="calendar-month-year">
                      {MONTH_NAMES[viewMonth]} {viewYear}
                    </span>
                    <button
                      type="button"
                      className="calendar-nav-btn"
                      onClick={handleNextMonth}
                      title="Next Month"
                    >
                      <ChevronRight size={15} />
                    </button>
                  </div>

                  <div className="calendar-weekdays-row">
                    {WEEKDAY_NAMES.map((wd) => (
                      <span key={wd} className="calendar-weekday-label">
                        {wd}
                      </span>
                    ))}
                  </div>

                  <div className="calendar-days-grid">
                    {prevMonthDays.map((d) => (
                      <span key={`prev-${d}`} className="calendar-day-cell is-outside">
                        {d}
                      </span>
                    ))}

                    {currentMonthDays.map((dayNum) => {
                      const cellDateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                      const isSelected = cellDateStr === selectedDate;
                      const isCellToday = cellDateStr === getTodayDateString();
                      const hasData = activeCalendarDates.has(cellDateStr);

                      return (
                        <button
                          key={cellDateStr}
                          type="button"
                          className={`calendar-day-cell is-current-month ${isSelected ? 'is-selected' : ''} ${isCellToday ? 'is-today' : ''} ${hasData ? 'has-data' : ''}`}
                          onClick={() => {
                            setSelectedDate(cellDateStr);
                            setIsCalendarOpen(false);
                          }}
                          title={hasData ? `${cellDateStr} (Contains workshop records)` : cellDateStr}
                          aria-label={`${cellDateStr}${hasData ? ', has records' : ''}${isSelected ? ', selected' : ''}${isCellToday ? ', today' : ''}`}
                        >
                          {dayNum}
                          {isCellToday && !isSelected && <span className="today-dot" />}
                        </button>
                      );
                    })}

                    {nextMonthDays.map((d) => (
                      <span key={`next-${d}`} className="calendar-day-cell is-outside">
                        {d}
                      </span>
                    ))}
                  </div>

                  <div className="calendar-popover-footer">
                    <button
                      type="button"
                      className="calendar-footer-btn jump-today-btn"
                      onClick={jumpToToday}
                    >
                      <RotateCcw size={12} />
                      <span>Today</span>
                    </button>
                    <span className="calendar-footer-selected">
                      Selected: <strong>{formattedSelectedDDMMYYYY}</strong>
                    </span>
                    <button
                      type="button"
                      className="calendar-footer-btn close-btn"
                      onClick={() => setIsCalendarOpen(false)}
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* + Intake New Device Button */}
            <Link href="/repairs" style={{ textDecoration: 'none' }}>
              <button type="button" className="dashboard-intake-btn">
                <Plus size={16} strokeWidth={2.5} />
                <span>Intake New Device</span>
              </button>
            </Link>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 1.5 SUBSCRIPTION COUNTDOWN & EXPIRY STATUS BAR             */}
        {/* ========================================================= */}
        {(() => {
          const activeShop = stats.subscription || currentShop || user?.shop;
          if (!activeShop || !activeShop.subscriptionExpiresAt) return null;
          return (
            <SubscriptionCountdownBar
              shop={activeShop}
              serverTime={stats.serverTime || activeShop.serverTime}
              onRenewSuccess={(renewRes) => {
                if (renewRes?.shop) {
                  updateCurrentShop(renewRes.shop);
                }
                refreshUser();
              }}
            />
          );
        })()}

        {/* ========================================================= */}
        {/* 2. TOP 6 KPI METRIC CARDS (EXACT UI FROM USER'S REQUEST)  */}
        {/* ========================================================= */}
        <div className="dashboard-kpi-wrapper">
          <KpiCards
            items={[
              {
                icon: <TrendingUp size={22} />,
                label: isToday ? "Today's Sales" : `Sales (${formattedSelectedDDMMYYYY})`,
                value: formatCurrency(stats.todaySales || 0),
                color: 'blue',
                accent: true,
                delta: stats.todaySales > 0 ? `₹${(stats.todaySales || 0).toLocaleString('en-IN')}` : undefined,
                deltaColor: '#16a34a',
                sub: isToday ? 'Revenue recorded today' : `Revenue on ${formattedSelectedDDMMYYYY}`,
              },
              {
                icon: <Wrench size={22} />,
                label: isToday ? "Today's Service Jobs" : `Service Jobs (${formattedSelectedDDMMYYYY})`,
                value: stats.activeRepairs || 0,
                color: 'purple',
                accent: true,
                delta: stats.activeRepairs > 0 ? `${stats.activeRepairs} tickets` : undefined,
                deltaColor: '#7c3aed',
                sub: isToday ? 'Tickets created today' : `Tickets created on ${formattedSelectedDDMMYYYY}`,
              },
              {
                icon: <CheckCircle2 size={22} />,
                label: isToday ? 'Ready for Pickup' : `Ready / Delivered (${formattedSelectedDDMMYYYY})`,
                value: stats.readyForPickup || 0,
                color: 'emerald',
                accent: true,
                delta: stats.readyForPickup > 0 ? 'Ready' : undefined,
                deltaColor: '#059669',
                sub: isToday ? 'Awaiting client delivery' : `Relevant to ${formattedSelectedDDMMYYYY}`,
              },
              {
                icon: <IndianRupee size={22} />,
                label: isToday ? 'Pending Receivables' : `Receivables (${formattedSelectedDDMMYYYY})`,
                value: formatCurrency(stats.pendingDueAmount || 0),
                color: 'orange',
                accent: true,
                valueColor: stats.pendingDueAmount > 0 ? '#ea580c' : undefined,
                sub: isToday ? 'Uncollected client dues' : `Uncollected balance on ${formattedSelectedDDMMYYYY}`,
              },
              {
                icon: <Users size={22} />,
                label: isToday ? 'New Customers' : `New Customers (${formattedSelectedDDMMYYYY})`,
                value: stats.totalCustomers || 0,
                color: 'teal',
                accent: true,
                delta: stats.totalCustomers > 0 ? `${stats.totalCustomers} new` : undefined,
                deltaColor: '#0d9488',
                sub: isToday ? 'Registered today' : `Registered on ${formattedSelectedDDMMYYYY}`,
              },
              {
                icon: <Box size={22} />,
                label: 'Low Stock Parts',
                value: stats.lowStockItemsCount || 0,
                color: stats.lowStockItemsCount > 0 ? 'red' : 'emerald',
                accent: true,
                valueColor: stats.lowStockItemsCount > 0 ? '#dc2626' : undefined,
                delta: stats.lowStockItemsCount > 0 ? 'Action' : 'Healthy',
                deltaColor: stats.lowStockItemsCount > 0 ? '#dc2626' : '#059669',
                sub: stats.lowStockItemsCount > 0 ? 'Threshold alerts' : 'Stock healthy',
              },
            ]}
          />
        </div>

        {/* ========================================================= */}
        {/* 3. SECTION 1: LIVE REPAIR QUEUE & PIPELINE (BALANCED ROW) */}
        {/* ========================================================= */}
        <div className="dashboard-section-grid">
          {/* Left: Live Work Orders Queue */}
          <div className="dashboard-card dashboard-card-balanced">
            <div>
              <div className="dashboard-card-header">
                <div className="dashboard-card-title-group">
                  <h2>Live Work Orders Queue</h2>
                  <p>
                    {isToday
                      ? 'Real-time ticket progression & parts status'
                      : `Repair tickets recorded on ${formattedSelectedDDMMYYYY}`}
                  </p>
                </div>
                <Link href="/repairs" className="dashboard-link-action">
                  <span>View All Jobs</span>
                  <ArrowRight size={14} />
                </Link>
              </div>

              {jobs.length === 0 ? (
                <div className="dashboard-empty-card">
                  <div className="dashboard-empty-icon">
                    <Wrench size={22} />
                  </div>
                  <h4 className="dashboard-empty-title">
                    {isLoading
                      ? 'Loading repair jobs...'
                      : `No repair jobs recorded on ${formattedSelectedDDMMYYYY}`}
                  </h4>
                  <p className="dashboard-empty-desc">
                    {isToday
                      ? 'Create your first repair ticket for today to track customer devices.'
                      : `No tickets were logged on ${formattedSelectedDDMMYYYY}. Try selecting another date or return to today.`}
                  </p>
                  {!isToday ? (
                    <button
                      type="button"
                      onClick={jumpToToday}
                      className="dashboard-reset-today-btn"
                    >
                      <RotateCcw size={13} />
                      <span>Return to Today</span>
                    </button>
                  ) : (
                    <Link href="/repairs" style={{ textDecoration: 'none', marginTop: '6px' }}>
                      <button type="button" className="dashboard-intake-btn" style={{ padding: '7px 14px', fontSize: '12px' }}>
                        <Plus size={14} /> Create Repair Job
                      </button>
                    </Link>
                  )}
                </div>
              ) : (
                <div className="dashboard-table-container">
                  <table className="dashboard-table">
                    <thead>
                      <tr>
                        <th>JOB ID</th>
                        <th>CUSTOMER & ISSUE</th>
                        <th>DEVICE</th>
                        <th>STAGE</th>
                        <th>AMOUNT</th>
                        <th style={{ textAlign: 'right' }}>ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {jobs.map((job) => (
                        <tr key={job.id || job.jobNo} className="dashboard-table-row">
                          <td>
                            <Link href="/repairs" style={{ textDecoration: 'none' }}>
                              <span className="job-id-pill">{job.jobNo}</span>
                            </Link>
                          </td>

                          <td>
                            <div className="customer-cell">
                              <div className="customer-initial-avatar">
                                {job.customer ? job.customer.charAt(0).toUpperCase() : 'C'}
                              </div>
                              <div>
                                <div className="customer-name">{job.customer}</div>
                                <div className="customer-issue">{job.issue}</div>
                              </div>
                            </div>
                          </td>

                          <td>
                            <div className="device-tag">
                              <Smartphone size={14} />
                              <span>{job.device}</span>
                            </div>
                          </td>

                          <td>{getStageBadge(job.stage)}</td>

                          <td>
                            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: '700', fontSize: '13px', color: '#0f172a' }}>
                              {formatCurrency(job.amount)}
                            </span>
                          </td>

                          <td style={{ textAlign: 'right' }}>
                            <Link href="/repairs" style={{ textDecoration: 'none' }}>
                              <button type="button" className="table-view-btn">
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

            <div className="dashboard-card-footer">
              <span>Showing {jobs.length} workshop {jobs.length === 1 ? 'ticket' : 'tickets'} on {formattedSelectedDDMMYYYY}</span>
              <Link href="/repairs" className="dashboard-link-action" style={{ fontSize: '11.5px' }}>
                Manage All Tickets →
              </Link>
            </div>
          </div>

          {/* Right: Quick Actions & Repair Pipeline */}
          <div className="dashboard-column-stacked">
            {/* Quick Actions */}
            <div className="dashboard-card">
              <div className="dashboard-card-header" style={{ marginBottom: '14px' }}>
                <div className="dashboard-card-title-group">
                  <h3>Quick Actions</h3>
                  <p>Frequently accessed workshop tools</p>
                </div>
              </div>

              <div className="quick-actions-grid">
                <Link href="/repairs" style={{ textDecoration: 'none' }}>
                  <div className="quick-action-item">
                    <div className="quick-action-icon" style={{ background: '#eff6ff', color: '#2563eb' }}>
                      <Wrench size={17} />
                    </div>
                    <div className="quick-action-text">
                      <span className="quick-action-title">New Job Card</span>
                      <span className="quick-action-desc">+ Quick Intake</span>
                    </div>
                  </div>
                </Link>

                <Link href="/pos" style={{ textDecoration: 'none' }}>
                  <div className="quick-action-item">
                    <div className="quick-action-icon" style={{ background: '#ecfdf5', color: '#059669' }}>
                      <IndianRupee size={17} />
                    </div>
                    <div className="quick-action-text">
                      <span className="quick-action-title">POS Billing</span>
                      <span className="quick-action-desc">Invoice & Pay</span>
                    </div>
                  </div>
                </Link>

                <Link href="/customers" style={{ textDecoration: 'none' }}>
                  <div className="quick-action-item">
                    <div className="quick-action-icon" style={{ background: '#fff7ed', color: '#ea580c' }}>
                      <Users size={17} />
                    </div>
                    <div className="quick-action-text">
                      <span className="quick-action-title">Add Customer</span>
                      <span className="quick-action-desc">Client Directory</span>
                    </div>
                  </div>
                </Link>

                <Link href="/inventory" style={{ textDecoration: 'none' }}>
                  <div className="quick-action-item">
                    <div className="quick-action-icon" style={{ background: '#faf5ff', color: '#7c3aed' }}>
                      <Box size={17} />
                    </div>
                    <div className="quick-action-text">
                      <span className="quick-action-title">Add Inventory</span>
                      <span className="quick-action-desc">Stock & Parts</span>
                    </div>
                  </div>
                </Link>
              </div>
            </div>

            {/* Repair Pipeline */}
            <div className="dashboard-card">
              <div className="dashboard-card-header">
                <div className="dashboard-card-title-group">
                  <h3>Repair Pipeline</h3>
                  <p>Active workshop ticket flow</p>
                </div>
                <div className="pipeline-filter-pill">
                  <span>{pipelineFilter}</span>
                  <ChevronDown size={12} />
                </div>
              </div>

              <div className="pipeline-list">
                {/* Intake & Diagnosis */}
                <div className="pipeline-item">
                  <div className="pipeline-item-head">
                    <span className="pipeline-stage-name">
                      <span className="pipeline-stage-dot" style={{ background: '#2563eb' }} />
                      Intake & Diagnosis
                    </span>
                    <span className="pipeline-stage-count" style={{ color: '#2563eb' }}>
                      {stats.pipeline?.intakeCount || 0} tickets
                    </span>
                  </div>
                  <div className="pipeline-bar-track">
                    <div
                      className="pipeline-bar-fill"
                      style={{
                        width: getPipelineWidth(stats.pipeline?.intakeCount),
                        background: '#2563eb',
                      }}
                    />
                  </div>
                </div>

                {/* In Progress */}
                <div className="pipeline-item">
                  <div className="pipeline-item-head">
                    <span className="pipeline-stage-name">
                      <span className="pipeline-stage-dot" style={{ background: '#f59e0b' }} />
                      In Progress
                    </span>
                    <span className="pipeline-stage-count" style={{ color: '#d97706' }}>
                      {stats.pipeline?.inProgressCount || 0} tickets
                    </span>
                  </div>
                  <div className="pipeline-bar-track">
                    <div
                      className="pipeline-bar-fill"
                      style={{
                        width: getPipelineWidth(stats.pipeline?.inProgressCount),
                        background: '#f59e0b',
                      }}
                    />
                  </div>
                </div>

                {/* Ready for Pickup */}
                <div className="pipeline-item">
                  <div className="pipeline-item-head">
                    <span className="pipeline-stage-name">
                      <span className="pipeline-stage-dot" style={{ background: '#10b981' }} />
                      Ready for Pickup
                    </span>
                    <span className="pipeline-stage-count" style={{ color: '#059669' }}>
                      {stats.pipeline?.readyCount || 0} tickets
                    </span>
                  </div>
                  <div className="pipeline-bar-track">
                    <div
                      className="pipeline-bar-fill"
                      style={{
                        width: getPipelineWidth(stats.pipeline?.readyCount),
                        background: '#10b981',
                      }}
                    />
                  </div>
                </div>

                {/* Delivered */}
                <div className="pipeline-item">
                  <div className="pipeline-item-head">
                    <span className="pipeline-stage-name">
                      <span className="pipeline-stage-dot" style={{ background: '#8b5cf6' }} />
                      Delivered
                    </span>
                    <span className="pipeline-stage-count" style={{ color: '#7c3aed' }}>
                      {stats.pipeline?.deliveredCount || 0} tickets
                    </span>
                  </div>
                  <div className="pipeline-bar-track">
                    <div
                      className="pipeline-bar-fill"
                      style={{
                        width: getPipelineWidth(stats.pipeline?.deliveredCount),
                        background: '#8b5cf6',
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 4. SECTION 2: RECENT PAYMENTS & WORKSHOP PULSE (BALANCED) */}
        {/* ========================================================= */}
        <div className="dashboard-section-grid">
          {/* Left: Recent Payments */}
          <div className="dashboard-card dashboard-card-balanced">
            <div>
              <div className="dashboard-card-header">
                <div className="dashboard-card-title-group">
                  <h2>Recent Payments</h2>
                  <p>
                    {isToday
                      ? 'Latest transaction ledger and payment modes'
                      : `Transactions recorded on ${formattedSelectedDDMMYYYY}`}
                  </p>
                </div>
                <Link href="/payments" className="dashboard-link-action">
                  <span>View All</span>
                  <ArrowRight size={14} />
                </Link>
              </div>

              {stats.recentPayments.length === 0 ? (
                <div className="dashboard-empty-card">
                  <div className="dashboard-empty-icon" style={{ background: '#ecfdf5', color: '#059669' }}>
                    <CreditCard size={22} />
                  </div>
                  <h4 className="dashboard-empty-title">
                    {isLoading
                      ? 'Loading transactions...'
                      : `No transactions on ${formattedSelectedDDMMYYYY}`}
                  </h4>
                  <p className="dashboard-empty-desc">
                    {isToday
                      ? 'Completed repair collections and POS sales will appear here.'
                      : `No payment collections or invoices were recorded on ${formattedSelectedDDMMYYYY}.`}
                  </p>
                </div>
              ) : (
                <div className="dashboard-table-container">
                  <table className="dashboard-table">
                    <thead>
                      <tr>
                        <th>DATE</th>
                        <th>CUSTOMER</th>
                        <th>AMOUNT</th>
                        <th>METHOD</th>
                        <th style={{ textAlign: 'right' }}>STATUS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.recentPayments.map((p, idx) => (
                        <tr key={idx} className="dashboard-table-row">
                          <td style={{ fontSize: '12px', color: '#475569', fontWeight: '600' }}>
                            {p.date}
                          </td>
                          <td>
                            <span style={{ fontSize: '12.5px', fontWeight: '700', color: '#0f172a' }}>
                              {p.customer}
                            </span>
                          </td>
                          <td>
                            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: '700', fontSize: '12.5px', color: '#0f172a' }}>
                              {formatCurrency(p.amount)}
                            </span>
                          </td>
                          <td>{getPaymentMethodBadge(p.method)}</td>
                          <td style={{ textAlign: 'right' }}>
                            <span className="dashboard-status-badge badge-delivered">
                              <span className="badge-dot" />
                              {p.status || 'Completed'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="dashboard-card-footer">
              <span>Showing {stats.recentPayments.length} transactions on {formattedSelectedDDMMYYYY}</span>
              <Link href="/payments" className="dashboard-link-action" style={{ fontSize: '11.5px' }}>
                View Full Ledger →
              </Link>
            </div>
          </div>

          {/* Right: Low Stock Alerts & Today's Activity */}
          <div className="dashboard-column-stacked">
            {/* Low Stock Alerts */}
            <div className="dashboard-card">
              <div className="dashboard-card-header">
                <div className="dashboard-card-title-group">
                  <h3>Low Stock Alerts</h3>
                  <p>Inventory replenishment status</p>
                </div>
                <Link href="/inventory" className="dashboard-link-action">
                  <span>View All</span>
                  <ArrowRight size={14} />
                </Link>
              </div>

              {stats.lowStockList.length === 0 ? (
                <div className="inventory-healthy-state">
                  <div className="inventory-healthy-icon">
                    <ShieldCheck size={22} />
                  </div>
                  <div className="inventory-healthy-text">
                    <h4>Stock Levels Healthy</h4>
                    <p>All spare parts and components are above minimum threshold.</p>
                  </div>
                </div>
              ) : (
                <div className="dashboard-table-container">
                  <table className="dashboard-table">
                    <thead>
                      <tr>
                        <th>PART NAME</th>
                        <th style={{ textAlign: 'center' }}>CURRENT</th>
                        <th style={{ textAlign: 'right' }}>THRESHOLD</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.lowStockList.map((item, idx) => (
                        <tr key={idx} className="dashboard-table-row">
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div
                                style={{
                                  width: '24px',
                                  height: '24px',
                                  borderRadius: '5px',
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
                          <td style={{ textAlign: 'center' }}>
                            <span style={{ fontSize: '12px', fontWeight: '800', color: '#dc2626', fontFamily: 'JetBrains Mono, monospace' }}>
                              {item.current}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right', fontSize: '11.5px', color: '#64748b', fontFamily: 'JetBrains Mono, monospace' }}>
                            {item.threshold}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Today's Activity */}
            <div className="dashboard-card">
              <div className="dashboard-card-header">
                <div className="dashboard-card-title-group">
                  <h3>{isToday ? "Today's Activity" : `Activity (${formattedSelectedDDMMYYYY})`}</h3>
                  <p>
                    {isToday
                      ? 'Real-time audit log of workshop operations'
                      : `Actions recorded on ${formattedSelectedDDMMYYYY}`}
                  </p>
                </div>
              </div>

              {stats.recentActivities.length === 0 ? (
                <div className="dashboard-empty-card" style={{ padding: '24px 16px' }}>
                  <div className="dashboard-empty-icon" style={{ width: '36px', height: '36px' }}>
                    <Clock size={18} />
                  </div>
                  <h4 className="dashboard-empty-title">
                    {isLoading
                      ? 'Loading activity...'
                      : `No activity logged on ${formattedSelectedDDMMYYYY}`}
                  </h4>
                  <p className="dashboard-empty-desc">
                    {isToday
                      ? 'Actions will appear in this live timeline.'
                      : `No operations were logged on ${formattedSelectedDDMMYYYY}.`}
                  </p>
                </div>
              ) : (
                <div className="activity-timeline">
                  {stats.recentActivities.map((act, idx) => {
                    const isPayment = act.text?.toLowerCase().includes('payment') || act.text?.includes('₹');
                    return (
                      <div key={idx} className="activity-timeline-item">
                        <div className={`activity-timeline-node ${isPayment ? 'activity-node-payment' : ''}`}>
                          {isPayment ? <IndianRupee size={10} /> : <Wrench size={10} />}
                        </div>
                        <span className="activity-time" style={isPayment ? { color: '#059669' } : {}}>
                          {act.time}
                        </span>
                        <span className="activity-desc">{act.text}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </MainLayout>
  );
};

export default DashboardPage;
