import { JobCard } from '../repairs/repair.model.js';
import { Customer } from '../customers/customer.model.js';
import { SparePart } from '../inventory/inventory.model.js';
import { Device } from '../devices/device.model.js';
import { Invoice } from '../pos/pos.model.js';
import { Warranty } from '../warranties/warranty.model.js';
import { Shop } from '../shops/shop.model.js';

// Escape regex special characters to prevent ReDoS / regex crash
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export class SearchService {
  /**
   * Universal Omni-Search across all workshop & system resources
   * @param {string} rawQuery - search term
   * @param {object} context - { shopId, role, limit }
   */
  async omniSearch(rawQuery = '', { shopId = null, role = null, limit = 5 } = {}) {
    const q = String(rawQuery || '').trim();
    if (!q) {
      return {
        query: '',
        totalCount: 0,
        categories: {
          repairs: [],
          customers: [],
          inventory: [],
          devices: [],
          invoices: [],
          warranties: [],
          shops: [],
          quickNav: [],
        },
      };
    }

    const maxPerCat = Math.min(Math.max(Number(limit) || 5, 1), 20);
    const escaped = escapeRegex(q);
    const regex = new RegExp(escaped, 'i');

    // Scoped shop query filter (Super Admin gets universal view, Shop Owner strictly isolated)
    const baseFilter = (role !== 'SUPER_ADMIN' && shopId) ? { shopId } : {};

    // 1. Navigation Quick Links
    const quickNav = this.matchQuickNav(q, role);

    // 2. Parallel queries across all entities
    const [
      repairsResult,
      customersResult,
      inventoryResult,
      devicesResult,
      invoicesResult,
      warrantiesResult,
      shopsResult,
    ] = await Promise.allSettled([
      // A. Repairs / Job Cards
      JobCard.find({
        ...baseFilter,
        $or: [
          { number: { $regex: regex } },
          { 'customer.name': { $regex: regex } },
          { 'customer.mobile': { $regex: regex } },
          { 'device.brand': { $regex: regex } },
          { 'device.model': { $regex: regex } },
          { 'device.imei': { $regex: regex } },
          { issue: { $regex: regex } },
          { status: { $regex: regex } },
        ],
      })
        .select('number customer device issue status priority estimatedAmount createdAt')
        .sort({ createdAt: -1 })
        .limit(maxPerCat)
        .lean(),

      // B. Customers
      Customer.find({
        ...baseFilter,
        $or: [
          { name: { $regex: regex } },
          { mobile: { $regex: regex } },
          { email: { $regex: regex } },
          { city: { $regex: regex } },
          { deviceBrand: { $regex: regex } },
          { deviceModel: { $regex: regex } },
        ],
      })
        .select('name mobile email city deviceBrand deviceModel totalRepairs pendingDue')
        .sort({ createdAt: -1 })
        .limit(maxPerCat)
        .lean(),

      // C. Inventory / Spare Parts
      SparePart.find({
        ...baseFilter,
        $or: [
          { name: { $regex: regex } },
          { sku: { $regex: regex } },
          { brand: { $regex: regex } },
          { compatibleModel: { $regex: regex } },
          { category: { $regex: regex } },
          { locationRack: { $regex: regex } },
        ],
      })
        .select('name sku category brand compatibleModel quantity minimumQuantity sellingPrice status locationRack')
        .sort({ name: 1 })
        .limit(maxPerCat)
        .lean(),

      // D. Devices
      Device.find({
        ...baseFilter,
        $or: [
          { brand: { $regex: regex } },
          { model: { $regex: regex } },
          { imei1: { $regex: regex } },
          { imei2: { $regex: regex } },
          { serialNumber: { $regex: regex } },
          { customerName: { $regex: regex } },
        ],
      })
        .select('brand model imei1 serialNumber customerName type condition')
        .sort({ createdAt: -1 })
        .limit(maxPerCat)
        .lean(),

      // E. POS Invoices / Sales
      Invoice.find({
        ...baseFilter,
        $or: [
          { number: { $regex: regex } },
          { orderId: { $regex: regex } },
          { customerName: { $regex: regex } },
          { customerMobile: { $regex: regex } },
          { deviceModel: { $regex: regex } },
        ],
      })
        .select('number orderId customerName customerMobile deviceModel totalAmount paymentStatus invoiceType createdAt')
        .sort({ createdAt: -1 })
        .limit(maxPerCat)
        .lean(),

      // F. Warranties
      Warranty.find({
        ...baseFilter,
        $or: [
          { repairNumber: { $regex: regex } },
          { customerName: { $regex: regex } },
          { customerMobile: { $regex: regex } },
          { deviceBrand: { $regex: regex } },
          { deviceModel: { $regex: regex } },
          { imei: { $regex: regex } },
        ],
      })
        .select('repairNumber customerName customerMobile deviceBrand deviceModel status expiryDate')
        .sort({ createdAt: -1 })
        .limit(maxPerCat)
        .lean(),

      // G. Admin Workshops (Super Admin Only)
      role === 'SUPER_ADMIN'
        ? Shop.find({
            $or: [
              { name: { $regex: regex } },
              { shopCode: { $regex: regex } },
              { 'owner.name': { $regex: regex } },
              { 'owner.email': { $regex: regex } },
              { 'owner.phone': { $regex: regex } },
              { 'address.city': { $regex: regex } },
            ],
          })
            .select('name shopCode owner subscription subscriptionStatus address.city')
            .sort({ createdAt: -1 })
            .limit(maxPerCat)
            .lean()
        : Promise.resolve([]),
    ]);

    // Format results cleanly for consumption
    const repairs = (repairsResult.status === 'fulfilled' ? repairsResult.value : []).map((j) => ({
      id: j._id,
      category: 'repairs',
      title: j.number || 'Job Card',
      subtitle: `${j.device?.brand || ''} ${j.device?.model || ''} • ${j.customer?.name || 'Client'}`.trim(),
      meta: j.status || 'Received',
      badge: j.priority === 'Urgent' ? 'Urgent' : (j.status || 'Active'),
      badgeVariant: j.priority === 'Urgent' ? 'danger' : 'primary',
      url: '/repairs',
      extra: {
        issue: j.issue,
        mobile: j.customer?.mobile,
        amount: j.estimatedAmount,
      },
    }));

    const customers = (customersResult.status === 'fulfilled' ? customersResult.value : []).map((c) => ({
      id: c._id,
      category: 'customers',
      title: c.name || 'Customer',
      subtitle: `${c.mobile || 'No Mobile'} • ${c.city || 'Client'}`.trim(),
      meta: `${c.totalRepairs || 0} repairs`,
      badge: c.pendingDue > 0 ? `₹${c.pendingDue} due` : 'Clean Account',
      badgeVariant: c.pendingDue > 0 ? 'warning' : 'success',
      url: '/customers',
      extra: {
        email: c.email,
        device: `${c.deviceBrand || ''} ${c.deviceModel || ''}`.trim(),
      },
    }));

    const inventory = (inventoryResult.status === 'fulfilled' ? inventoryResult.value : []).map((p) => {
      const isLow = p.quantity <= (p.minimumQuantity || 3);
      const isOut = p.quantity <= 0;
      return {
        id: p._id,
        category: 'inventory',
        title: p.name || 'Spare Part',
        subtitle: `SKU: ${p.sku} • ${p.brand || 'Universal'} ${p.compatibleModel ? `(${p.compatibleModel})` : ''}`.trim(),
        meta: `Qty: ${p.quantity} on shelf`,
        badge: isOut ? 'Out of Stock' : (isLow ? 'Low Stock' : 'In Stock'),
        badgeVariant: isOut ? 'danger' : (isLow ? 'warning' : 'success'),
        url: '/inventory',
        extra: {
          price: p.sellingPrice,
          rack: p.locationRack,
        },
      };
    });

    const devices = (devicesResult.status === 'fulfilled' ? devicesResult.value : []).map((d) => ({
      id: d._id,
      category: 'devices',
      title: `${d.brand || ''} ${d.model || ''}`.trim() || 'Device Registry',
      subtitle: `IMEI: ${d.imei1 || '—'} • ${d.customerName || 'Intake'}`.trim(),
      meta: d.type || 'Smartphone',
      badge: d.condition || 'Registered',
      badgeVariant: 'secondary',
      url: '/devices',
    }));

    const invoices = (invoicesResult.status === 'fulfilled' ? invoicesResult.value : []).map((inv) => ({
      id: inv._id,
      category: 'invoices',
      title: inv.number || 'Invoice',
      subtitle: `${inv.customerName || 'Walk-in'} • ${inv.deviceModel || inv.invoiceType || 'Sale'}`.trim(),
      meta: `₹${inv.totalAmount || 0}`,
      badge: inv.paymentStatus || 'Invoice',
      badgeVariant: inv.paymentStatus === 'PAID' ? 'success' : 'warning',
      url: `/pos/invoices/${inv._id}`,
    }));

    const warranties = (warrantiesResult.status === 'fulfilled' ? warrantiesResult.value : []).map((w) => ({
      id: w._id,
      category: 'warranties',
      title: `Warranty #${w.repairNumber}`,
      subtitle: `${w.customerName || ''} • ${w.deviceModel || ''}`.trim(),
      meta: w.status || 'Active',
      badge: w.status || 'Warranty',
      badgeVariant: w.status === 'ACTIVE' ? 'success' : (w.status === 'EXPIRED' ? 'danger' : 'warning'),
      url: '/warranties',
    }));

    const shops = (shopsResult.status === 'fulfilled' ? shopsResult.value : []).map((s) => ({
      id: s._id,
      category: 'shops',
      title: s.name || 'Workshop',
      subtitle: `Code: ${s.shopCode || ''} • Owner: ${s.owner?.name || s.owner?.email || ''}`.trim(),
      meta: s.address?.city || 'India',
      badge: s.subscription || 'Plan',
      badgeVariant: 'primary',
      url: `/admin/shops/${s._id}`,
    }));

    const totalCount =
      quickNav.length +
      repairs.length +
      customers.length +
      inventory.length +
      devices.length +
      invoices.length +
      warranties.length +
      shops.length;

    return {
      query: q,
      totalCount,
      categories: {
        quickNav,
        repairs,
        customers,
        inventory,
        devices,
        invoices,
        warranties,
        shops,
      },
    };
  }

  /**
   * Helper to resolve quick navigation links matching query
   */
  matchQuickNav(query = '', role = null) {
    const q = query.toLowerCase();
    const navItems = [
      {
        id: 'nav-repairs',
        title: 'Repair Job Cards & Bench',
        subtitle: 'View intake board, bench diagnostics & status updates',
        url: '/repairs',
        keywords: ['repair', 'job', 'ticket', 'bench', 'board', 'diagnose', 'fix', 'hardware'],
        badge: 'Repairs',
      },
      {
        id: 'nav-customers',
        title: 'Customer Directory & CRM',
        subtitle: 'Manage client accounts, contact details & balance due',
        url: '/customers',
        keywords: ['customer', 'client', 'crm', 'contact', 'people', 'mobile', 'balance'],
        badge: 'CRM',
      },
      {
        id: 'nav-inventory',
        title: 'Inventory Shelf & Spare Parts',
        subtitle: 'Stock counts, SKU catalog, rack locations & low alerts',
        url: '/inventory',
        keywords: ['inventory', 'part', 'spare', 'stock', 'sku', 'shelf', 'rack', 'display', 'battery'],
        badge: 'Stock',
      },
      {
        id: 'nav-pos',
        title: 'POS Billing & Quick Checkout',
        subtitle: 'Create tax invoice, process sales & print receipts',
        url: '/pos',
        keywords: ['pos', 'billing', 'invoice', 'checkout', 'sale', 'tax', 'receipt', 'bill'],
        badge: 'POS',
      },
      {
        id: 'nav-devices',
        title: 'Device Registry & IMEI Logs',
        subtitle: 'Serial numbers, intake checklists and condition audits',
        url: '/devices',
        keywords: ['device', 'gadget', 'imei', 'serial', 'model', 'mobile', 'phone', 'tablet'],
        badge: 'Devices',
      },
      {
        id: 'nav-warranties',
        title: 'Warranty Certificates & Claims',
        subtitle: 'Hardware warranty tracking, digital certificates & validity',
        url: '/warranties',
        keywords: ['warranty', 'guarantee', 'claim', 'certificate', 'validity', 'void'],
        badge: 'Warranty',
      },
      {
        id: 'nav-payments',
        title: 'Payment Ledger & Transactions',
        subtitle: 'Cash, UPI, card settlement records and receipts',
        url: '/payments',
        keywords: ['payment', 'ledger', 'cash', 'upi', 'card', 'transaction', 'paid', 'due'],
        badge: 'Finance',
      },
      {
        id: 'nav-suppliers',
        title: 'Suppliers & Vendor Directory',
        subtitle: 'Wholesalers, part vendors and vendor ledger balances',
        url: '/suppliers',
        keywords: ['supplier', 'vendor', 'wholesaler', 'procure', 'dealer'],
        badge: 'Vendors',
      },
      {
        id: 'nav-purchases',
        title: 'Purchase History & POs',
        subtitle: 'Purchase bills, stock intake and invoices',
        url: '/purchases',
        keywords: ['purchase', 'procurement', 'po', 'order', 'intake', 'buy'],
        badge: 'Purchases',
      },
      {
        id: 'nav-used-mobiles',
        title: 'Used Mobiles Marketplace',
        subtitle: 'Refurbished devices, buy-in and resale catalog',
        url: '/used-mobiles',
        keywords: ['used', 'mobile', 'resale', 'refurbished', 'second hand', 'buy phone'],
        badge: 'Marketplace',
      },
      {
        id: 'nav-ai',
        title: 'AI Smart Diagnostics',
        subtitle: 'Automated problem triage, estimate predictor and part guidance',
        url: '/ai',
        keywords: ['ai', 'diagnostic', 'smart', 'intelligence', 'predict', 'estimate'],
        badge: 'AI Assistant',
      },
      {
        id: 'nav-reports',
        title: 'Analytics & Financial Reports',
        subtitle: 'Revenue metrics, repair volume and business telemetry',
        url: '/reports',
        keywords: ['report', 'analytics', 'stat', 'revenue', 'chart', 'profit', 'telemetry'],
        badge: 'Reports',
      },
      {
        id: 'nav-settings',
        title: 'Workshop Settings & Security',
        subtitle: 'Store profile, tax rate, invoice templates and preferences',
        url: '/settings',
        keywords: ['setting', 'config', 'preference', 'shop', 'profile', 'security', 'tax', 'logo'],
        badge: 'Settings',
      },
    ];

    if (role === 'SUPER_ADMIN') {
      navItems.push(
        {
          id: 'nav-admin-shops',
          title: 'Workshops & Shop Management',
          subtitle: 'Super Admin: Manage all tenant repair shops, plans & access',
          url: '/admin/shops',
          keywords: ['shop', 'workshop', 'tenant', 'store', 'franchise', 'management'],
          badge: 'Super Admin',
        },
        {
          id: 'nav-admin-subs',
          title: 'Subscription Plans & Tiers',
          subtitle: 'Configure pricing, trial periods and module packages',
          url: '/admin/subscriptions',
          keywords: ['subscription', 'plan', 'tier', 'pricing', 'license'],
          badge: 'Super Admin',
        },
        {
          id: 'nav-admin-activity',
          title: 'Platform Audit & Login Logs',
          subtitle: 'Security access audits and system administrator activity',
          url: '/admin/activity',
          keywords: ['audit', 'log', 'activity', 'security', 'access', 'session'],
          badge: 'Super Admin',
        }
      );
    }

    return navItems.filter((item) => {
      if (item.title.toLowerCase().includes(q)) return true;
      if (item.subtitle.toLowerCase().includes(q)) return true;
      return item.keywords.some((k) => k.includes(q) || q.includes(k));
    });
  }
}
