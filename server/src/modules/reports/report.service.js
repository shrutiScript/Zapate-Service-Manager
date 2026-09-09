import { Repair } from '../repairs/repair.model.js';
import { Customer } from '../customers/customer.model.js';
import { SparePart } from '../inventory/inventory.model.js';
import { Invoice } from '../pos/pos.model.js';
import { Purchase } from '../purchases/purchase.model.js';
import { UsedMobile } from '../used-mobiles/usedMobile.model.js';
import { PaymentLedger } from '../payments/payment.model.js';

export class ReportService {
  async getDashboardStats(shopId = null, role = null) {
    let filter = {};
    if (shopId) {
      filter = { shopId };
    } else if (role !== 'SUPER_ADMIN') {
      filter = { shopId: '000000000000000000000000' };
    }

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const [
      todayRepairs,
      pendingRepairs,
      completedRepairs,
      readyForDelivery,
      totalCustomers,
      totalInventory,
      lowStockItems,
      invoices,
      intakeCount,
      inProgressCount,
      readyCount,
      deliveredCount,
      recentPaymentsDocs,
      lowStockListDocs,
      recentRepairsDocs,
    ] = await Promise.all([
      Repair.countDocuments({ ...filter, createdAt: { $gte: startOfDay } }),
      Repair.countDocuments({
        ...filter,
        status: { $nin: ['Delivered', 'Cancelled', 'Returned Unrepaired'] },
      }),
      Repair.countDocuments({
        ...filter,
        status: { $in: ['Delivered', 'Completed'] },
      }),
      Repair.countDocuments({
        ...filter,
        status: { $in: ['Ready for Delivery', 'Ready for Pickup'] },
      }),
      Customer.countDocuments(filter),
      SparePart.countDocuments(filter),
      SparePart.countDocuments({
        ...filter,
        $or: [{ status: 'Low Stock' }, { status: 'Out of Stock' }, { quantity: { $lte: 5 } }],
      }),
      Invoice.find(filter).sort({ createdAt: -1 }),
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
      PaymentLedger.find(filter).sort({ createdAt: -1 }).limit(5),
      SparePart.find({
        ...filter,
        $or: [{ status: 'Low Stock' }, { status: 'Out of Stock' }, { quantity: { $lte: 5 } }],
      }).sort({ quantity: 1 }).limit(5),
      Repair.find(filter).sort({ createdAt: -1 }).limit(6),
    ]);

    const todayInvoices = invoices.filter((i) => new Date(i.createdAt) >= startOfDay);
    const todaySales = todayInvoices.reduce((sum, i) => sum + (i.total || 0), 0);
    const pendingDueAmount = invoices.reduce((sum, i) => sum + (i.dueAmount || 0), 0);

    // Format recent payments (fallback to recent invoices if ledger is empty)
    let recentPayments = recentPaymentsDocs.map((p) => ({
      date: p.createdAt ? new Date(p.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : 'Today',
      customer: p.customerName || 'Client',
      amount: p.amount || 0,
      method: p.method || 'UPI',
      status: 'Completed',
    }));

    if (recentPayments.length === 0 && invoices.length > 0) {
      recentPayments = invoices.slice(0, 4).map((i) => ({
        date: i.createdAt ? new Date(i.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : 'Today',
        customer: i.customerName || 'Client',
        amount: i.paidAmount !== undefined ? i.paidAmount : (i.total || 0),
        method: i.paymentMethod || 'UPI',
        status: 'Completed',
      }));
    }

    // Format low stock alerts
    const lowStockList = lowStockListDocs.map((item) => ({
      name: item.name || 'Spare Part',
      category: item.category || 'Components',
      current: item.quantity !== undefined ? item.quantity : 0,
      threshold: item.minimumQuantity || 10,
    }));

    // Format activity timeline
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

    return {
      todayRepairs: todayRepairs || 0,
      pendingRepairs: pendingRepairs || 0,
      completedRepairs: completedRepairs || 0,
      readyForDelivery: readyForDelivery || 0,
      todaySales: todaySales || 0,
      pendingDueAmount: pendingDueAmount || 0,
      totalCustomers: totalCustomers || 0,
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
      recentActivities: recentActivities.slice(0, 4),
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

  async getAnalytics(shopId = null) {
    const filter = shopId ? { shopId } : {};

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const [invoices, repairs] = await Promise.all([
      Invoice.find({ ...filter, createdAt: { $gte: sevenDaysAgo } }),
      Repair.find({ ...filter, createdAt: { $gte: sevenDaysAgo } }),
    ]);

    const totalRevenue = invoices.reduce((sum, i) => sum + (i.total || 0), 0);
    const completedRepairs = repairs.filter((r) => r.status === 'Completed' || r.status === 'Delivered').length;
    const avgJobValue = repairs.length > 0
      ? Math.round(repairs.reduce((sum, r) => sum + (r.finalAmount || r.estimatedAmount || 0), 0) / repairs.length)
      : 0;

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dailyBreakdown = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayStart = new Date(d);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(d);
      dayEnd.setHours(23, 59, 59, 999);

      const dayInvoices = invoices.filter((inv) => {
        const t = new Date(inv.createdAt);
        return t >= dayStart && t <= dayEnd;
      });
      const dayRepairs = repairs.filter((rep) => {
        const t = new Date(rep.createdAt);
        return t >= dayStart && t <= dayEnd;
      });

      const dayTotal = dayInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
      dailyBreakdown.push({
        day: days[d.getDay()],
        val: dayTotal,
        count: dayRepairs.length,
      });
    }

    const catMap = {};
    repairs.forEach((r) => {
      const cat = r.problem || r.deviceModel || 'General Repair';
      const amt = r.finalAmount || r.estimatedAmount || 0;
      if (!catMap[cat]) catMap[cat] = { count: 0, amount: 0 };
      catMap[cat].count += 1;
      catMap[cat].amount += amt;
    });

    const categories = Object.keys(catMap).map((k) => ({
      name: k,
      amount: catMap[k].amount,
      count: catMap[k].count,
      share: totalRevenue > 0 ? `${Math.round((catMap[k].amount / totalRevenue) * 100)}%` : '0%',
    }));

    return {
      weeklyRevenue: totalRevenue,
      completedRepairs,
      avgJobValue,
      totalRepairsCount: repairs.length,
      totalInvoicesCount: invoices.length,
      dailyBreakdown,
      categories,
      hasData: invoices.length > 0 || repairs.length > 0,
    };
  }
}
