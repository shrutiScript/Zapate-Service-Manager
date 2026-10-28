import { Repair } from '../repairs/repair.model.js';
import { Customer } from '../customers/customer.model.js';
import { SparePart } from '../inventory/inventory.model.js';
import { Invoice } from '../pos/pos.model.js';
import { Purchase } from '../purchases/purchase.model.js';
import { UsedMobile } from '../used-mobiles/usedMobile.model.js';
import { Payment, PaymentLedger } from '../payments/payment.model.js';
import { Shop } from '../shops/shop.model.js';
import { subscriptionService } from '../shops/subscription.service.js';
import { getDayRange } from '../../utils/date.js';

export class ReportService {
  async getDashboardStats(shopId = null, role = null, options = {}) {
    let filter = {};
    if (shopId) {
      filter = { shopId };
    } else if (role !== 'SUPER_ADMIN') {
      filter = { shopId: '000000000000000000000000' };
    }

    const { startOfDay, endOfDay, selectedDate, timezoneOffset } = getDayRange(options?.date, options?.timezoneOffset);
    const dateWindow = { $gte: startOfDay, $lte: endOfDay };

    const [
      dateRepairs,
      pendingRepairs,
      completedRepairs,
      readyOnDateCount,
      totalReadyCount,
      dateCustomers,
      totalCustomers,
      totalInventory,
      lowStockItems,
      invoicesOnDate,
      allInvoices,
      intakeCount,
      inProgressCount,
      readyCount,
      deliveredCount,
      paymentsDocs,
      ledgerDocs,
      lowStockListDocs,
      recentRepairsDocs,
    ] = await Promise.all([
      // 1. Repair jobs created on that date
      Repair.countDocuments({ ...filter, createdAt: dateWindow }),

      // 2. Active repairs created on or before that date still open
      Repair.countDocuments({
        ...filter,
        createdAt: { $lte: endOfDay },
        status: { $nin: ['Delivered', 'Cancelled', 'Returned Unrepaired'] },
      }),

      // 3. Completed repairs delivered/finished on that date
      Repair.countDocuments({
        ...filter,
        status: { $in: ['Delivered', 'Completed'] },
        $or: [{ updatedAt: dateWindow }, { createdAt: dateWindow }],
      }),

      // 4a. Ready for delivery transitioned on that date
      Repair.countDocuments({
        ...filter,
        status: { $in: ['Ready for Delivery', 'Ready for Pickup'] },
        $or: [{ updatedAt: dateWindow }, { createdAt: dateWindow }],
      }),

      // 4b. Total ready for delivery awaiting pickup up to that date
      Repair.countDocuments({
        ...filter,
        status: { $in: ['Ready for Delivery', 'Ready for Pickup'] },
        createdAt: { $lte: endOfDay },
      }),

      // 5. New customer registrations on that date
      Customer.countDocuments({ ...filter, createdAt: dateWindow }),

      // 6. Total registered customer profiles
      Customer.countDocuments(filter),

      // 7. Total inventory parts
      SparePart.countDocuments(filter),

      // 8. Low stock alert count
      SparePart.countDocuments({
        ...filter,
        $or: [{ status: 'Low Stock' }, { status: 'Out of Stock' }, { quantity: { $lte: 5 } }],
      }),

      // 9. Invoices created on that date
      Invoice.find({ ...filter, createdAt: dateWindow }).sort({ createdAt: -1 }),

      // 10. All invoices for cumulative receivables
      Invoice.find(filter).sort({ createdAt: -1 }),

      // 11-14. Active workshop ticket flow pipeline
      Repair.countDocuments({
        ...filter,
        status: { $in: ['Device Received', 'Diagnosis Pending', 'Diagnosis Completed', 'Waiting Approval', 'Received'] },
      }),
      Repair.countDocuments({
        ...filter,
        status: { $in: ['Repair in Progress', 'Waiting Parts', 'Parts Ordered', 'In Progress'] },
      }),
      Repair.countDocuments({
        ...filter,
        status: { $in: ['Ready for Delivery', 'Ready for Pickup', 'Quality Check'] },
      }),
      Repair.countDocuments({
        ...filter,
        status: { $in: ['Delivered', 'Completed'] },
      }),

      // 15. Payments recorded on that date using paymentDate / createdAt
      Payment.find({
        ...filter,
        $or: [{ paymentDate: dateWindow }, { createdAt: dateWindow }],
      }).sort({ paymentDate: -1, createdAt: -1 }).limit(10),

      // 16. PaymentLedger recorded on that date
      PaymentLedger.find({
        ...filter,
        createdAt: dateWindow,
      }).sort({ createdAt: -1 }).limit(10),

      // 17. Low stock list
      SparePart.find({
        ...filter,
        $or: [{ status: 'Low Stock' }, { status: 'Out of Stock' }, { quantity: { $lte: 5 } }],
      }).sort({ quantity: 1 }).limit(5),

      // 18. Recent repairs created on that date
      Repair.find({
        ...filter,
        createdAt: dateWindow,
      }).sort({ createdAt: -1 }).limit(6),
    ]);

    const readyForDelivery = readyOnDateCount > 0 ? readyOnDateCount : totalReadyCount;
    const dateSales = invoicesOnDate.reduce((sum, i) => sum + (i.total || 0), 0);
    const dateDueAmount = invoicesOnDate.reduce((sum, i) => sum + (i.dueAmount || 0), 0);
    const allPendingDueAmount = allInvoices.reduce((sum, i) => sum + (i.dueAmount || 0), 0);

    const nowUtcMs = Date.now();
    const localMs = nowUtcMs - (timezoneOffset || -330) * 60 * 1000;
    const localToday = new Date(localMs);
    const todayStr = `${localToday.getUTCFullYear()}-${String(localToday.getUTCMonth() + 1).padStart(2, '0')}-${String(localToday.getUTCDate()).padStart(2, '0')}`;
    const isSelectedDateToday = selectedDate === todayStr;

    // Format payments recorded on that date
    let recentPayments = [];
    if (paymentsDocs.length > 0) {
      recentPayments = paymentsDocs.map((p) => {
        const pDate = p.paymentDate || p.createdAt;
        return {
          date: pDate ? new Date(pDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : selectedDate,
          customer: p.customerName || 'Client',
          amount: p.amount || 0,
          method: p.paymentMethod || 'UPI',
          status: 'Completed',
        };
      });
    } else if (ledgerDocs.length > 0) {
      recentPayments = ledgerDocs.map((l) => ({
        date: l.createdAt ? new Date(l.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : selectedDate,
        customer: l.customerName || 'Client',
        amount: l.amount || 0,
        method: l.method || 'UPI',
        status: 'Completed',
      }));
    } else if (invoicesOnDate.length > 0) {
      recentPayments = invoicesOnDate
        .filter((i) => (i.paidAmount || 0) > 0)
        .slice(0, 5)
        .map((i) => ({
          date: i.createdAt ? new Date(i.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : selectedDate,
          customer: i.customerName || 'Client',
          amount: i.paidAmount !== undefined ? i.paidAmount : (i.total || 0),
          method: i.paymentMethod || 'UPI',
          status: 'Completed',
        }));
    }

    // Fallback: If viewing today and no payments were recorded yet today, show the latest workshop payments
    if (recentPayments.length === 0 && isSelectedDateToday) {
      const [latestPaymentsDocs, latestInvoicesDocs] = await Promise.all([
        Payment.find(filter).sort({ paymentDate: -1, createdAt: -1 }).limit(5).lean(),
        Invoice.find({ ...filter, paidAmount: { $gt: 0 } }).sort({ createdAt: -1 }).limit(5).lean(),
      ]);

      if (latestPaymentsDocs && latestPaymentsDocs.length > 0) {
        recentPayments = latestPaymentsDocs.map((p) => {
          const pDate = p.paymentDate || p.createdAt;
          return {
            date: pDate ? new Date(pDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : 'Recent',
            customer: p.customerName || 'Client',
            amount: p.amount || 0,
            method: p.paymentMethod || 'UPI',
            status: 'Completed',
            isRecentFallback: true,
          };
        });
      } else if (latestInvoicesDocs && latestInvoicesDocs.length > 0) {
        recentPayments = latestInvoicesDocs.map((i) => ({
          date: i.createdAt ? new Date(i.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : 'Recent',
          customer: i.customerName || 'Client',
          amount: i.paidAmount !== undefined ? i.paidAmount : (i.total || 0),
          method: i.paymentMethod || 'UPI',
          status: 'Completed',
          isRecentFallback: true,
        }));
      }
    }

    // Format low stock alerts
    const lowStockList = lowStockListDocs.map((item) => ({
      name: item.name || 'Spare Part',
      category: item.category || 'Components',
      current: item.quantity !== undefined ? item.quantity : 0,
      threshold: item.minimumQuantity || 10,
    }));

    // Format activity timeline strictly for that date
    const recentActivities = [];
    for (const r of recentRepairsDocs) {
      const timeStr = r.createdAt ? new Date(r.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '10:00 AM';
      const devName = (typeof r.device === 'object' ? `${r.device?.brand || ''} ${r.device?.model || ''}`.trim() : r.deviceModel) || 'Device';
      const cust = (typeof r.customer === 'object' ? r.customer?.name : r.customerName) || 'Customer';

      if (r.status === 'Delivered' || r.status === 'Completed') {
        recentActivities.push({
          time: timeStr,
          text: `Job delivered - ${r.number || r.repairNumber || 'RF-0000'}`,
        });
      } else {
        recentActivities.push({
          time: timeStr,
          text: `New repair job created - ${devName} (${cust})`,
        });
      }
    }

    if (recentPayments.length > 0) {
      recentActivities.splice(1, 0, {
        time: '09:45 AM',
        text: `Payment received - ₹${Number(recentPayments[0].amount || 0).toLocaleString('en-IN')} (${recentPayments[0].method || 'UPI'})`,
      });
    }

    let subscription = null;
    const serverTime = new Date();
    if (shopId) {
      try {
        const currentShop = await Shop.findById(shopId);
        if (currentShop) {
          const daysRemaining = subscriptionService.getDaysRemaining(currentShop, serverTime);
          const liveStatus = subscriptionService.calculateStatus(currentShop, serverTime);
          subscription = {
            shopId: currentShop._id,
            id: currentShop._id,
            _id: currentShop._id,
            name: currentShop.name,
            plan: currentShop.subscription,
            subscription: currentShop.subscription,
            startDate: currentShop.subscriptionStartDate,
            subscriptionStartDate: currentShop.subscriptionStartDate,
            expiresAt: currentShop.subscriptionExpiresAt,
            subscriptionExpiresAt: currentShop.subscriptionExpiresAt,
            status: liveStatus,
            subscriptionStatus: liveStatus,
            paymentStatus: currentShop.subscriptionPaymentStatus,
            subscriptionPaymentStatus: currentShop.subscriptionPaymentStatus,
            billingCycle: currentShop.subscriptionBillingCycle,
            subscriptionBillingCycle: currentShop.subscriptionBillingCycle,
            daysRemaining,
            serverTime,
          };
        }
      } catch (_) {}
    }

    return {
      selectedDate,
      startOfDay,
      endOfDay,
      timezoneOffset,
      todayRepairs: dateRepairs || 0,
      dateRepairs: dateRepairs || 0,
      activeRepairs: dateRepairs || 0,
      totalActiveRepairs: pendingRepairs || 0,
      pendingRepairs: pendingRepairs || 0,
      completedRepairs: completedRepairs || 0,
      readyForDelivery: readyForDelivery || 0,
      todaySales: dateSales || 0,
      dateSales: dateSales || 0,
      pendingDueAmount: dateDueAmount > 0 ? dateDueAmount : allPendingDueAmount,
      allPendingDueAmount: allPendingDueAmount || 0,
      totalCustomers: dateCustomers > 0 ? dateCustomers : totalCustomers,
      dateCustomers: dateCustomers || 0,
      allCustomersCount: totalCustomers || 0,
      totalInventory: totalInventory || 0,
      lowStockItemsCount: lowStockItems || 0,
      pipeline: {
        intakeCount: intakeCount || 0,
        inProgressCount: inProgressCount || 0,
        readyCount: readyCount || 0,
        deliveredCount: deliveredCount || 0,
      },
      recentPayments,
      lowStockList,
      recentActivities: recentActivities.slice(0, 6),
      subscription,
      serverTime,
    };
  }

  async getReports(type = 'sales', range = 'month', shopId = null) {
    const filter = shopId ? { shopId } : {};

    let dateFilter = {};
    const now = new Date();
    if (range === 'today') {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      dateFilter = { createdAt: { $gte: d } };
    } else if (range === 'week') {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      dateFilter = { createdAt: { $gte: d } };
    } else if (range === 'month') {
      const d = new Date();
      d.setMonth(d.getMonth() - 1);
      dateFilter = { createdAt: { $gte: d } };
    }

    const query = { ...filter, ...dateFilter };

    if (type === 'repairs') {
      const repairs = await Repair.find(query).sort({ createdAt: -1 });
      return { type: 'repairs', count: repairs.length, data: repairs };
    }

    if (type === 'inventory') {
      const parts = await SparePart.find(filter).sort({ quantity: 1 });
      return { type: 'inventory', count: parts.length, data: parts };
    }

    if (type === 'purchases') {
      const purchases = await Purchase.find(query).sort({ createdAt: -1 });
      return { type: 'purchases', count: purchases.length, data: purchases };
    }

    if (type === 'used-mobiles') {
      const mobiles = await UsedMobile.find(query).sort({ createdAt: -1 });
      return { type: 'used-mobiles', count: mobiles.length, data: mobiles };
    }

    if (type === 'payments') {
      const ledger = await PaymentLedger.find(query).sort({ createdAt: -1 });
      return { type: 'payments', count: ledger.length, data: ledger };
    }

    // Default: Sales
    const invoices = await Invoice.find(query).sort({ createdAt: -1 });
    const totalRevenue = invoices.reduce((sum, i) => sum + (i.total || 0), 0);
    const totalCollected = invoices.reduce((sum, i) => sum + (i.paidAmount || 0), 0);
    const totalDue = invoices.reduce((sum, i) => sum + (i.dueAmount || 0), 0);

    return {
      type: 'sales',
      count: invoices.length,
      totalRevenue,
      totalCollected,
      totalDue,
      data: invoices,
    };
  }

  async getAnalytics(shopId = null, range = 'all') {
    const filter = shopId ? { shopId } : {};

    let startDate = null;
    const now = new Date();
    if (range === 'today') {
      startDate = new Date(now);
      startDate.setHours(0, 0, 0, 0);
    } else if (range === '7d' || range === 'week') {
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 7);
      startDate.setHours(0, 0, 0, 0);
    } else if (range === '30d' || range === 'month') {
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 30);
      startDate.setHours(0, 0, 0, 0);
    } else if (range === '90d') {
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 90);
      startDate.setHours(0, 0, 0, 0);
    }

    const rangeFilter = startDate ? { ...filter, createdAt: { $gte: startDate } } : filter;

    const [allInvoices, allRepairs, rangeInvoices, rangeRepairs] = await Promise.all([
      Invoice.find(filter).sort({ createdAt: -1 }),
      Repair.find(filter).sort({ createdAt: -1 }),
      Invoice.find(rangeFilter).sort({ createdAt: -1 }),
      Repair.find(rangeFilter).sort({ createdAt: -1 }),
    ]);

    const activeInvoices = range === 'all' || !startDate ? allInvoices : rangeInvoices;
    const activeRepairs = range === 'all' || !startDate ? allRepairs : rangeRepairs;

    const totalRevenue = activeInvoices.reduce((sum, i) => sum + (i.total || 0), 0);
    const totalCollected = activeInvoices.reduce((sum, i) => sum + (i.paidAmount !== undefined ? i.paidAmount : (i.total || 0)), 0);
    const totalDue = activeInvoices.reduce((sum, i) => sum + (i.dueAmount || 0), 0);
    const completedRepairs = activeRepairs.filter((r) => r.status === 'Completed' || r.status === 'Delivered').length;
    const avgJobValue = activeRepairs.length > 0
      ? Math.round(activeRepairs.reduce((sum, r) => sum + (r.finalAmount || r.estimatedAmount || 0), 0) / activeRepairs.length)
      : (activeInvoices.length > 0 ? Math.round(totalRevenue / activeInvoices.length) : 0);

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dailyBreakdown = [];

    if (range === '7d' || range === 'week') {
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dayStart = new Date(d);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(d);
        dayEnd.setHours(23, 59, 59, 999);

        const dayInvoices = activeInvoices.filter((inv) => {
          const t = new Date(inv.createdAt);
          return t >= dayStart && t <= dayEnd;
        });
        const dayRepairs = activeRepairs.filter((rep) => {
          const t = new Date(rep.createdAt);
          return t >= dayStart && t <= dayEnd;
        });

        dailyBreakdown.push({
          day: days[d.getDay()],
          val: dayInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0),
          count: dayRepairs.length,
        });
      }
    } else {
      const dateMap = {};
      activeInvoices.forEach((inv) => {
        const d = new Date(inv.createdAt);
        const dateKey = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
        dateMap[dateKey] = (dateMap[dateKey] || 0) + (inv.total || 0);
      });

      const dateKeys = Object.keys(dateMap);
      if (dateKeys.length > 0) {
        dateKeys.slice(0, 8).reverse().forEach((key) => {
          dailyBreakdown.push({
            day: key,
            val: dateMap[key],
            count: activeRepairs.filter((r) => new Date(r.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) === key).length,
          });
        });
      } else {
        for (let i = 6; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          dailyBreakdown.push({
            day: days[d.getDay()],
            val: 0,
            count: 0,
          });
        }
      }
    }

    const catMap = {};
    activeRepairs.forEach((r) => {
      let cat = r.issue || r.problem || (r.device && r.device.model) || 'General Repair';
      if (cat.length > 36) cat = cat.slice(0, 33) + '...';
      const amt = r.finalAmount || r.estimatedAmount || 0;
      if (!catMap[cat]) catMap[cat] = { count: 0, amount: 0 };
      catMap[cat].count += 1;
      catMap[cat].amount += amt;
    });

    const categories = Object.keys(catMap).map((k) => ({
      name: k,
      amount: catMap[k].amount,
      count: catMap[k].count,
      share: totalRevenue > 0 ? `${Math.round((catMap[k].amount / totalRevenue) * 100)}%` : `${Math.round((catMap[k].count / (activeRepairs.length || 1)) * 100)}%`,
    }));

    const methodMap = {};
    activeInvoices.forEach((inv) => {
      const m = inv.paymentMethod || 'Cash';
      methodMap[m] = (methodMap[m] || 0) + (inv.total || 0);
    });

    const paymentMethods = Object.keys(methodMap).map((m) => ({
      name: m,
      amount: methodMap[m],
      share: totalRevenue > 0 ? `${Math.round((methodMap[m] / totalRevenue) * 100)}%` : '0%',
    }));

    const statusMap = {};
    activeRepairs.forEach((r) => {
      const s = r.status || 'Device Received';
      statusMap[s] = (statusMap[s] || 0) + 1;
    });

    const repairStatuses = Object.keys(statusMap).map((s) => ({
      status: s,
      count: statusMap[s],
      share: activeRepairs.length > 0 ? `${Math.round((statusMap[s] / activeRepairs.length) * 100)}%` : '0%',
    }));

    const recentTransactions = activeInvoices.slice(0, 10).map((inv) => ({
      id: inv._id,
      number: inv.number || inv.orderId || 'INV-0000',
      customerName: inv.customerName || 'Walk-in Client',
      device: inv.deviceModel || inv.deviceBrand || (inv.items && inv.items[0]?.name) || 'Service Item',
      amount: inv.total || 0,
      paidAmount: inv.paidAmount !== undefined ? inv.paidAmount : (inv.total || 0),
      dueAmount: inv.dueAmount || 0,
      paymentMethod: inv.paymentMethod || 'UPI',
      date: inv.createdAt,
    }));

    const allTimeRevenue = allInvoices.reduce((sum, i) => sum + (i.total || 0), 0);
    const allTimeCollected = allInvoices.reduce((sum, i) => sum + (i.paidAmount !== undefined ? i.paidAmount : (i.total || 0)), 0);
    const allTimeDue = allInvoices.reduce((sum, i) => sum + (i.dueAmount || 0), 0);

    return {
      range,
      weeklyRevenue: totalRevenue,
      totalRevenue,
      totalCollected,
      totalDue,
      completedRepairs,
      avgJobValue,
      totalRepairsCount: activeRepairs.length,
      totalInvoicesCount: activeInvoices.length,
      dailyBreakdown,
      categories,
      paymentMethods,
      repairStatuses,
      recentTransactions,
      allTime: {
        revenue: allTimeRevenue,
        collected: allTimeCollected,
        due: allTimeDue,
        invoicesCount: allInvoices.length,
        repairsCount: allRepairs.length,
      },
      hasData: allInvoices.length > 0 || allRepairs.length > 0,
    };
  }

  async getActiveCalendarDates(shopId = null, role = null, options = {}) {
    let filter = {};
    if (shopId) {
      filter = { shopId };
    } else if (role !== 'SUPER_ADMIN') {
      filter = { shopId: '000000000000000000000000' };
    }

    let year = Number(options?.year);
    let month = Number(options?.month); // 1-12

    let offset = -330;
    if (options?.timezoneOffset !== undefined && options?.timezoneOffset !== null && options?.timezoneOffset !== '') {
      const parsed = parseInt(options.timezoneOffset, 10);
      if (!isNaN(parsed)) {
        offset = parsed;
      }
    }

    if (!year || isNaN(year) || !month || isNaN(month) || month < 1 || month > 12) {
      const now = new Date();
      const localMs = now.getTime() - offset * 60 * 1000;
      const localDate = new Date(localMs);
      year = localDate.getUTCFullYear();
      month = localDate.getUTCMonth() + 1;
    }

    // Include 7 days buffer before and after the month to cover visible calendar grid cells
    const lastDayOfMonth = new Date(year, month, 0).getDate();
    const rangeStart = new Date(Date.UTC(year, month - 1, 1 - 7, 0, 0, 0, 0) + offset * 60 * 1000);
    const rangeEnd = new Date(Date.UTC(year, month - 1, lastDayOfMonth + 7, 23, 59, 59, 999) + offset * 60 * 1000);

    const dateFilter = { $gte: rangeStart, $lte: rangeEnd };

    const toDateStrInTz = (date) => {
      if (!date) return null;
      const localMs = new Date(date).getTime() - offset * 60 * 1000;
      const localDate = new Date(localMs);
      const y = localDate.getUTCFullYear();
      const mo = String(localDate.getUTCMonth() + 1).padStart(2, '0');
      const d = String(localDate.getUTCDate()).padStart(2, '0');
      return `${y}-${mo}-${d}`;
    };

    const [
      repairsDocs,
      invoicesDocs,
      paymentsDocs,
      ledgerDocs,
      customersDocs,
      purchasesDocs,
      usedMobilesDocs,
    ] = await Promise.all([
      Repair.find({
        ...filter,
        $or: [{ createdAt: dateFilter }, { updatedAt: dateFilter }],
      }, { createdAt: 1, updatedAt: 1 }).lean(),

      Invoice.find({
        ...filter,
        createdAt: dateFilter,
      }, { createdAt: 1 }).lean(),

      Payment.find({
        ...filter,
        $or: [{ paymentDate: dateFilter }, { createdAt: dateFilter }],
      }, { paymentDate: 1, createdAt: 1 }).lean(),

      PaymentLedger.find({
        ...filter,
        createdAt: dateFilter,
      }, { createdAt: 1 }).lean(),

      Customer.find({
        ...filter,
        createdAt: dateFilter,
      }, { createdAt: 1 }).lean(),

      Purchase.find({
        ...filter,
        createdAt: dateFilter,
      }, { createdAt: 1 }).lean(),

      UsedMobile.find({
        ...filter,
        createdAt: dateFilter,
      }, { createdAt: 1 }).lean(),
    ]);

    const datesSet = new Set();
    const addDate = (d) => {
      const s = toDateStrInTz(d);
      if (s) datesSet.add(s);
    };

    repairsDocs.forEach((r) => {
      addDate(r.createdAt);
      addDate(r.updatedAt);
    });

    invoicesDocs.forEach((i) => addDate(i.createdAt));

    paymentsDocs.forEach((p) => {
      addDate(p.paymentDate || p.createdAt);
    });

    ledgerDocs.forEach((l) => addDate(l.createdAt));
    customersDocs.forEach((c) => addDate(c.createdAt));
    purchasesDocs.forEach((p) => addDate(p.createdAt));
    usedMobilesDocs.forEach((u) => addDate(u.createdAt));

    const activeDates = Array.from(datesSet).sort();

    return {
      year,
      month,
      activeDates,
    };
  }
}
