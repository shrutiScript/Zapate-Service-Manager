import React, { useState, useEffect } from 'react';
import { MainLayout } from '../../../components/layout/MainLayout.jsx';
import { formatCurrency, formatDate } from '../../../utils/formatters.js';
import { InvoiceReceiptView } from '../components/InvoiceReceiptView.jsx';
import { ReceivePaymentModal } from '../../payments/components/ReceivePaymentModal.jsx';
import { PaymentReceiptModal } from '../../payments/components/PaymentReceiptModal.jsx';
import { StockValidationModal } from '../components/StockValidationModal.jsx';
import {
  Search,
  Smartphone,
  Battery,
  Plus,
  Minus,
  Trash2,
  Receipt,
  CheckCircle,
  Clock,
  AlertCircle,
  Package,
  FileText,
  User,
  AlertTriangle,
  PlusCircle,
  Tag,
  Wrench,
  ArrowRight,
  Eye,
  Sliders,
  DollarSign,
  ExternalLink,
} from 'lucide-react';
import { useApp } from '../../../context/AppContext.jsx';
import { toast } from 'sonner';
import api from '../../../services/api.js';
import { validatePrice } from '../../../utils/validators.js';

export const PosCheckoutPage = () => {
  const { searchQuery: globalSearchQuery, setSearchQuery: setGlobalSearchQuery } = useApp();
  // Navigation tabs
  const [activeTab, setActiveTab] = useState('checkout'); // 'checkout' | 'invoices'

  // Products from inventory
  const [products, setProducts] = useState([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState(globalSearchQuery || '');

  // Form State - Section 1: Customer Information (Optional)
  const [customerName, setCustomerName] = useState('');
  const [customerMobile, setCustomerMobile] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');

  // Form State - Section 2: Billing Items (Cart)
  const [cart, setCart] = useState([]);

  // Form State - Section 3: Notes & Custom Fields
  const [notes, setNotes] = useState('');

  // Form State - Section 4: Payment Summary
  const [taxRate, setTaxRate] = useState('18');
  const [discountAmount, setDiscountAmount] = useState('0');
  const [paidAmountInput, setPaidAmountInput] = useState('');
  const [paymentMode, setPaymentMode] = useState('UPI');

  // Custom Item Modal state
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customItem, setCustomItem] = useState({ name: '', description: '', price: '100', qty: '1' });

  // Past Invoices state
  const [invoices, setInvoices] = useState([]);
  const [invoiceSearch, setInvoiceSearch] = useState(globalSearchQuery || '');

  useEffect(() => {
    if (globalSearchQuery !== undefined) {
      setSearchQuery(globalSearchQuery);
      setInvoiceSearch(globalSearchQuery);
    }
  }, [globalSearchQuery]);

  const handleProductSearchChange = (val) => {
    setSearchQuery(val);
    setGlobalSearchQuery(val);
  };

  const handleInvoiceSearchChange = (val) => {
    setInvoiceSearch(val);
    setGlobalSearchQuery(val);
  };
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState('ALL'); // 'ALL' | 'REPAIR' | 'QUICK_SALE' | 'PAID' | 'PENDING' | 'UNPAID'
  const [receiptInvoice, setReceiptInvoice] = useState(null);
  const [invoiceToDelete, setInvoiceToDelete] = useState(null);

  // Due Management Modals state
  const [receivePaymentInvoice, setReceivePaymentInvoice] = useState(null);
  const [paymentReceiptData, setPaymentReceiptData] = useState(null);

  // Stock Availability Warning Modal state
  const [stockWarningState, setStockWarningState] = useState({
    isOpen: false,
    item: null,
    requestedQty: 0,
    availableStock: 0,
    targetId: null,
    pendingCart: null,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const categories = ['All', 'Accessories', 'Chargers', 'Batteries', 'Covers', 'Spares', 'Other'];

  const loadProducts = () => {
    setIsLoading(true);
    api.get('/inventory')
      .then((res) => {
        if (Array.isArray(res)) {
          const mapped = res.map((item) => ({
            id: item._id || item.id,
            name: item.name || 'Spare Part / Accessory',
            category: item.category || 'Spares',
            brand: item.brand || item.compatibleModel || item.model || 'Universal',
            model: item.compatibleModel || item.model || '',
            price: item.sellingPrice || item.price || 0,
            quantity: item.quantity || 0,
            sku: item.sku || '',
            icon: (item.category || '').toLowerCase().includes('battery') ? Battery : Package,
          }));
          setProducts(mapped);
        } else {
          setProducts([]);
        }
      })
      .catch(() => {
        setProducts([]);
      })
      .finally(() => setIsLoading(false));
  };

  const loadInvoices = () => {
    api.get('/pos/invoices')
      .then((res) => {
        if (Array.isArray(res)) {
          setInvoices(res);
        } else {
          setInvoices([]);
        }
      })
      .catch(() => setInvoices([]));
  };

  useEffect(() => {
    loadProducts();
    loadInvoices();
  }, []);

  // Cart operations
  const addToCart = (p, requestedCount = 1) => {
    // Custom item without inventory tracking
    if (String(p.id).startsWith('custom-')) {
      const existing = cart.find((c) => c.id === p.id);
      if (existing) {
        setCart(cart.map((c) => (c.id === p.id ? { ...c, qty: c.qty + requestedCount } : c)));
      } else {
        setCart([...cart, { ...p, qty: requestedCount }]);
      }
      toast.success(`Added ${p.name} to cart`);
      return;
    }

    // Inventory Product
    const product = products.find((pr) => pr.id === p.id) || p;
    const availableStock = Number(product.quantity !== undefined ? product.quantity : (p.quantity || 0));

    // If completely out of stock
    if (availableStock <= 0) {
      toast.error('This item is currently out of stock.');
      return;
    }

    const existing = cart.find((c) => c.id === p.id);
    const currentCartQty = existing ? existing.qty : 0;
    const totalRequestedQty = currentCartQty + requestedCount;

    // User can add freely to cart; validation happens when confirming / generating invoice
    if (existing) {
      setCart(cart.map((c) => (c.id === p.id ? { ...c, qty: totalRequestedQty, stock: availableStock } : c)));
    } else {
      setCart([
        ...cart,
        {
          id: p.id,
          partId: p.id,
          name: p.name,
          brand: p.brand || '',
          model: p.model || '',
          sku: p.sku || '',
          price: p.price,
          qty: totalRequestedQty,
          stock: availableStock,
        },
      ]);
    }
    toast.success(`Added ${p.name} to cart`);
  };

  const addCustomItemToCart = (e) => {
    e.preventDefault();
    if (!customItem.name.trim()) {
      toast.error('Item name is required');
      return;
    }

    const priceCheck = validatePrice(customItem.price, 'Unit Price');
    if (!priceCheck.isValid) {
      toast.error(priceCheck.error);
      return;
    }

    const qtyNum = Math.max(1, Number(customItem.qty) || 1);

    setCart([
      ...cart,
      {
        id: `custom-${Date.now()}`,
        name: customItem.name.trim(),
        description: customItem.description.trim(),
        price: priceCheck.value,
        qty: qtyNum,
      },
    ]);

    toast.success(`Added "${customItem.name}" to cart`);
    setCustomItem({ name: '', description: '', price: '100', qty: '1' });
    setShowCustomModal(false);
  };

  // Important Requirement:
  // Do NOT restrict the user from increasing quantity using plus (+) button.
  // The user must be able to increase the quantity freely, even if greater than available stock.
  const updateQty = (id, delta) => {
    const existing = cart.find((c) => c.id === id);
    if (!existing) return;

    const nextQty = existing.qty + delta;
    if (nextQty <= 0) {
      removeFromCart(id);
      return;
    }

    // Custom items without inventory tracking
    if (String(id).startsWith('custom-')) {
      setCart(cart.map((c) => (c.id === id ? { ...c, qty: nextQty } : c)));
      return;
    }

    const product = products.find((pr) => pr.id === id);
    const availableStock = Number(product ? product.quantity : (existing.stock || 0));

    // Freely update quantity without blocking with modal
    setCart(cart.map((c) => (c.id === id ? { ...c, qty: nextQty, stock: availableStock } : c)));
  };

  // Allow editing quantity directly in the input freely
  const setItemQty = (id, rawValue) => {
    const parsed = parseInt(rawValue, 10);
    if (isNaN(parsed) || parsed <= 0) return;

    const existing = cart.find((c) => c.id === id);
    if (!existing) return;

    if (String(id).startsWith('custom-')) {
      setCart(cart.map((c) => (c.id === id ? { ...c, qty: parsed } : c)));
      return;
    }

    const product = products.find((pr) => pr.id === id);
    const availableStock = Number(product ? product.quantity : (existing.stock || 0));

    // Freely update quantity without blocking with modal
    setCart(cart.map((c) => (c.id === id ? { ...c, qty: parsed, stock: availableStock } : c)));
  };

  // Execute Invoice Creation / Sale Submission
  const executeCheckout = async (cartToSubmit) => {
    setIsSubmitting(true);
    try {
      const sub = cartToSubmit.reduce((sum, item) => sum + item.price * item.qty, 0);
      const tx = Math.round((sub * (Number(taxRate) || 0)) / 100);
      const dCheck = validatePrice(discountAmount || 0, 'Discount Amount', true);
      const disc = dCheck.isValid ? dCheck.value : 0;
      const gTotal = Math.max(0, sub + tx - disc);
      const pCheck = validatePrice(paidAmountInput, 'Paid Amount', true);
      const effPaid = paidAmountInput !== '' && pCheck.isValid ? pCheck.value : gTotal;
      const dueAmt = Math.max(0, gTotal - effPaid);

      const payload = {
        invoiceType: 'QUICK_SALE',
        customerName: customerName.trim() || 'Walk-in Client',
        customerMobile: customerMobile.trim(),
        customerEmail: customerEmail.trim(),
        customerAddress: customerAddress.trim(),
        notes: notes.trim(),
        items: cartToSubmit.map((c) => ({
          partId: String(c.id).startsWith('custom-') ? undefined : c.id,
          name: c.name,
          brand: c.brand || '',
          model: c.model || '',
          price: c.price,
          quantity: c.qty || 1,
          total: c.price * (c.qty || 1),
        })),
        subtotal: sub,
        taxAmount: tx,
        taxRate: Number(taxRate) || 0,
        discountAmount: disc,
        total: gTotal,
        paidAmount: effPaid,
        dueAmount: dueAmt,
        paymentMethod: paymentMode,
      };

      const res = await api.post('/pos/invoices', payload);
      const created = res.data || res;

      toast.success(`Quick sale completed for ${formatCurrency(gTotal)}!`);

      // Open printable receipt modal
      setReceiptInvoice(created);

      // Reset form
      setCart([]);
      setCustomerName('');
      setCustomerMobile('');
      setCustomerEmail('');
      setCustomerAddress('');
      setNotes('');
      setDiscountAmount('0');
      setPaidAmountInput('');

      loadProducts();
      loadInvoices();
    } catch (err) {
      // If backend detected stock shortage (e.g. concurrent sale reduced inventory)
      const serverAvail = err.availableStock ?? err.response?.data?.availableStock;
      const serverReq = err.requestedQuantity ?? err.response?.data?.requestedQuantity;
      const serverPartId = err.partId ?? err.response?.data?.partId;
      const serverPartName = err.partName ?? err.response?.data?.partName;

      if (serverAvail !== undefined && serverReq !== undefined) {
        const targetItem =
          cartToSubmit.find((c) => c.id === serverPartId) ||
          cartToSubmit.find((c) => c.name === serverPartName);

        if (serverAvail <= 0) {
          toast.error(`"${targetItem?.name || serverPartName || 'Item'}" is currently out of stock.`);
        } else {
          setStockWarningState({
            isOpen: true,
            item: targetItem || { name: serverPartName || 'Item', price: targetItem?.price || 0 },
            requestedQty: serverReq,
            availableStock: serverAvail,
            targetId: targetItem?.id || serverPartId,
            pendingCart: cartToSubmit,
          });
        }
      } else {
        toast.error(err.message || 'Checkout failed');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // If user selects "Continue with {availableStock} Items":
  // - Automatically change the invoice quantity to the available stock
  // - Keep the SAME unit price
  // - Do not change the product price
  // - Calculate the total using: Available Quantity × Existing Unit Price
  // - Add items to the invoice and complete the sale using quantity = availableStock
  // - Reduce inventory only after successful invoice completion
  const handleConfirmStockMax = async (maxAvailable) => {
    if (!stockWarningState.targetId || maxAvailable <= 0) {
      setStockWarningState({ isOpen: false, item: null, requestedQty: 0, availableStock: 0, targetId: null, pendingCart: null });
      return;
    }

    const targetId = stockWarningState.targetId;
    const currentCart = stockWarningState.pendingCart || cart;

    // 1. Automatically change invoice quantity from requested to available stock
    // 2. Keep the SAME unit price
    // 3. Line total is availableStock * unitPrice
    const updatedCart = currentCart.map((c) =>
      c.id === targetId ? { ...c, qty: maxAvailable, stock: maxAvailable } : c
    );

    // Update cart in state so UI immediately shows quantity = maxAvailable
    setCart(updatedCart);
    setStockWarningState({ isOpen: false, item: null, requestedQty: 0, availableStock: 0, targetId: null, pendingCart: null });

    // Check if any other item in updatedCart still exceeds available stock
    const nextOversold = updatedCart.find((c) => {
      if (String(c.id).startsWith('custom-')) return false;
      const prod = products.find((p) => p.id === c.id);
      const avail = prod ? Number(prod.quantity || 0) : Number(c.stock || 0);
      return c.qty > avail;
    });

    if (nextOversold) {
      const prod = products.find((p) => p.id === nextOversold.id);
      const avail = prod ? Number(prod.quantity || 0) : Number(nextOversold.stock || 0);
      setStockWarningState({
        isOpen: true,
        item: prod || nextOversold,
        requestedQty: nextOversold.qty,
        availableStock: avail,
        targetId: nextOversold.id,
        pendingCart: updatedCart,
      });
      return;
    }

    // All items now satisfy available stock -> Complete sale with adjusted quantity
    await executeCheckout(updatedCart);
  };

  // If user selects "Cancel":
  // - Do not add item to invoice
  // - Do not change inventory
  // - Allow user to increase or decrease quantity again
  const handleCancelStockWarning = () => {
    setStockWarningState({ isOpen: false, item: null, requestedQty: 0, availableStock: 0, targetId: null, pendingCart: null });
    setIsSubmitting(false);
  };

  const removeFromCart = (id) => {
    setCart(cart.filter((c) => c.id !== id));
  };

  // Financial calculations
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const tax = Math.round((subtotal * (Number(taxRate) || 0)) / 100);
  const discountCheck = validatePrice(discountAmount || 0, 'Discount Amount', true);
  const discount = discountCheck.isValid ? discountCheck.value : 0;
  const grandTotal = Math.max(0, subtotal + tax - discount);
  const paidCheck = validatePrice(paidAmountInput, 'Paid Amount', true);
  const effectivePaid = paidAmountInput !== '' && paidCheck.isValid ? paidCheck.value : grandTotal;
  const due = Math.max(0, grandTotal - effectivePaid);

  const paymentStatus = effectivePaid >= grandTotal ? 'PAID' : effectivePaid > 0 ? 'PENDING' : 'UNPAID';

  // Checkout Handler: Stock validation happens when confirming / generating invoice
  const handleCheckout = async (e) => {
    if (e && e.preventDefault) e.preventDefault();

    if (cart.length === 0) {
      toast.error('Cart is empty. Please select products or add custom items to complete sale.');
      return;
    }

    if (!discountCheck.isValid) {
      toast.error(discountCheck.error);
      return;
    }

    if (paidAmountInput !== '' && !paidCheck.isValid) {
      toast.error(paidCheck.error);
      return;
    }

    // Stock validation: Check requested quantity against actual available stock
    for (const c of cart) {
      if (!String(c.id).startsWith('custom-')) {
        const prod = products.find((p) => p.id === c.id);
        const avail = prod ? Number(prod.quantity || 0) : Number(c.stock || 0);

        if (avail <= 0) {
          toast.error(`"${c.name}" is currently out of stock. Please remove it before completing sale.`);
          return;
        }

        if (c.qty > avail) {
          setStockWarningState({
            isOpen: true,
            item: prod || c,
            requestedQty: c.qty,
            availableStock: avail,
            targetId: c.id,
            pendingCart: cart,
          });
          return;
        }
      }
    }

    // All items within stock -> complete checkout
    await executeCheckout(cart);
  };

  const handleDeleteInvoice = async () => {
    if (!invoiceToDelete) return;
    setIsDeleting(true);
    try {
      await api.delete(`/pos/${invoiceToDelete._id || invoiceToDelete.id}`);
      toast.success(`Invoice ${invoiceToDelete.number} deleted!`);
      setInvoiceToDelete(null);
      loadInvoices();
    } catch (err) {
      toast.error(err.message || 'Failed to delete invoice');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchesCat = activeCategory === 'All' || p.category.toLowerCase().includes(activeCategory.toLowerCase());
    const matchesSearch =
      (p.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.brand || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.model || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.sku || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const filteredInvoices = invoices.filter((inv) => {
    const q = invoiceSearch.toLowerCase();
    const matchesQ =
      (inv.number || '').toLowerCase().includes(q) ||
      (inv.orderId || '').toLowerCase().includes(q) ||
      (inv.customerName || '').toLowerCase().includes(q) ||
      (inv.customerMobile || '').toLowerCase().includes(q) ||
      (inv.deviceModel || '').toLowerCase().includes(q) ||
      (inv.items?.[0]?.name || '').toLowerCase().includes(q);

    let matchesFilter = true;
    if (invoiceStatusFilter === 'REPAIR') {
      matchesFilter = inv.invoiceType === 'REPAIR';
    } else if (invoiceStatusFilter === 'QUICK_SALE') {
      matchesFilter = inv.invoiceType === 'QUICK_SALE' || !inv.invoiceType;
    } else if (invoiceStatusFilter !== 'ALL') {
      matchesFilter = (inv.status || '').toUpperCase() === invoiceStatusFilter.toUpperCase();
    }

    return matchesQ && matchesFilter;
  });

  return (
    <MainLayout title="POS Counter Sales" subtitle="Quick Accessories & Product Checkout">
      <div className="page-header no-print">
        <div className="page-header-info">
          <div className="page-badge-eyebrow">
            <span /> COUNTER POS SALES
          </div>
          <h1>Quick Counter Sales & Invoicing</h1>
          <p>Instant over-the-counter billing for chargers, covers, accessories, and spare parts.</p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            className={activeTab === 'checkout' ? 'btn btn-primary' : 'btn btn-secondary'}
            onClick={() => setActiveTab('checkout')}
          >
            <Receipt size={16} /> Quick Counter Sale
          </button>
          <button
            type="button"
            className={activeTab === 'invoices' ? 'btn btn-primary' : 'btn btn-secondary'}
            onClick={() => {
              setActiveTab('invoices');
              loadInvoices();
            }}
          >
            <FileText size={16} /> Past Invoices ({invoices.length})
          </button>
        </div>
      </div>

      {activeTab === 'invoices' ? (
        /* ==================================================== */
        /* PAST INVOICES TAB (UNIFIED REPAIR & QUICK SALES)      */
        /* ==================================================== */
        <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {[
                { label: 'All Invoices', value: 'ALL' },
                { label: 'Repair Invoices', value: 'REPAIR' },
                { label: 'Quick Sales', value: 'QUICK_SALE' },
                { label: 'Paid', value: 'PAID' },
                { label: 'Pending / Due', value: 'PENDING' },
              ].map((filterOpt) => (
                <button
                  key={filterOpt.value}
                  type="button"
                  className={`btn btn-sm ${invoiceStatusFilter === filterOpt.value ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setInvoiceStatusFilter(filterOpt.value)}
                >
                  {filterOpt.label}
                </button>
              ))}
            </div>

            <div className="input-wrapper" style={{ width: '340px', position: 'relative' }}>
              <span className="input-icon"><Search size={15} /></span>
              <input
                type="text"
                className="input-control input-with-icon"
                placeholder="Search Invoice #, Order ID, Customer, Model..."
                value={invoiceSearch}
                onChange={(e) => handleInvoiceSearchChange(e.target.value)}
              />
              {invoiceSearch && (
                <button
                  type="button"
                  onClick={() => handleInvoiceSearchChange('')}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#94a3b8',
                    padding: '2px',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                  title="Clear search"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          <div className="table-container">
            <table className="pro-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Invoice & Order</th>
                  <th>Date & Time</th>
                  <th>Customer</th>
                  <th>Details / Items</th>
                  <th>Total Amount</th>
                  <th>Paid / Due</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', padding: '48px 20px', color: '#94a3b8' }}>
                      <Package size={32} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
                      <div>No invoices found matching your criteria.</div>
                    </td>
                  </tr>
                ) : (
                  filteredInvoices.map((inv) => {
                    const isRepair = inv.invoiceType === 'REPAIR';
                    const totalAmt = Number(inv.total) || 0;
                    const paidAmt = Number(inv.paidAmount !== undefined ? inv.paidAmount : totalAmt);
                    const dueAmt = Math.max(0, Number(inv.dueAmount !== undefined ? inv.dueAmount : totalAmt - paidAmt));

                    let rawStatus = (inv.status || 'PAID').toUpperCase();
                    if (rawStatus !== 'CANCELLED') {
                      if (dueAmt <= 0) rawStatus = 'PAID';
                      else if (paidAmt > 0) rawStatus = 'PARTIALLY PAID';
                      else rawStatus = 'UNPAID';
                    }

                    const isPaidStatus = rawStatus === 'PAID';
                    const isPartialStatus = rawStatus === 'PARTIALLY PAID' || rawStatus === 'PENDING' || rawStatus === 'PARTIAL';
                    const isUnpaidStatus = rawStatus === 'UNPAID';
                    const isCancelledStatus = rawStatus === 'CANCELLED';

                    return (
                      <tr key={inv._id || inv.id}>
                        <td>
                          <span
                            className={`status-badge ${isRepair ? 'badge-blue' : 'badge-green'}`}
                            style={{ fontSize: '10px', padding: '3px 8px' }}
                          >
                            {isRepair ? 'Repair Invoice' : 'Quick Sale'}
                          </span>
                        </td>
                        <td>
                          <strong style={{ color: '#0f172a', fontFamily: 'JetBrains Mono' }}>{inv.number}</strong>
                          {inv.orderId && <div style={{ fontSize: '11px', color: '#64748b' }}>{inv.orderId}</div>}
                        </td>
                        <td>
                          <div style={{ fontSize: '12px', color: '#0f172a' }}>{formatDate(inv.createdAt)}</div>
                          <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                            {new Date(inv.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </td>
                        <td>
                          <strong style={{ color: '#0f172a' }}>{inv.customerName || 'Walk-in Client'}</strong>
                          {inv.customerMobile && <div style={{ fontSize: '11px', color: '#64748b' }}>{inv.customerMobile}</div>}
                        </td>
                        <td>
                          {isRepair ? (
                            <div>
                              <strong style={{ fontSize: '12px', color: '#2563eb' }}>{inv.deviceModel || 'Mobile Repair'}</strong>
                              <div style={{ fontSize: '11px', color: '#64748b', maxWidth: '180px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                                Issue: {inv.reportedProblem || 'Hardware Service'}
                              </div>
                            </div>
                          ) : (
                            <div style={{ fontSize: '12px', color: '#334155' }}>
                              {inv.items?.map((item) => `${item.name} (${item.quantity})`).join(', ') || 'Counter items'}
                            </div>
                          )}
                        </td>
                        <td>
                          <strong style={{ fontSize: '13px', color: '#0f172a' }}>{formatCurrency(totalAmt)}</strong>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>{inv.paymentMethod || 'UPI'}</div>
                        </td>
                        <td>
                          <div style={{ fontSize: '12px', color: '#059669', fontWeight: '700' }}>Paid: {formatCurrency(paidAmt)}</div>
                          <div style={{ fontSize: '12px', color: dueAmt > 0 ? '#dc2626' : '#64748b', fontWeight: dueAmt > 0 ? '800' : '500' }}>
                            Due: {formatCurrency(dueAmt)}
                          </div>
                        </td>
                        <td>
                          <span
                            className={`status-badge ${
                              isPaidStatus
                                ? 'badge-green'
                                : isPartialStatus
                                ? 'badge-amber'
                                : isUnpaidStatus
                                ? 'badge-red'
                                : 'badge-dark'
                            }`}
                          >
                            {isPaidStatus
                              ? '🟢 Paid'
                              : isPartialStatus
                              ? '🟡 Partially Paid'
                              : isUnpaidStatus
                              ? '🔴 Unpaid'
                              : '⚫ Cancelled'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', flexWrap: 'nowrap' }}>
                            <button
                              type="button"
                              className="btn btn-sm btn-secondary"
                              onClick={() => setReceiptInvoice(inv)}
                              title="View / Print Invoice"
                            >
                              <Eye size={13} /> View Invoice
                            </button>
                            {dueAmt > 0 && !isCancelledStatus && (
                              <button
                                type="button"
                                className="btn btn-sm btn-primary"
                                style={{ background: '#059669', borderColor: '#059669' }}
                                onClick={() => setReceivePaymentInvoice(inv)}
                                title="Receive Outstanding Payment"
                              >
                                <DollarSign size={13} /> Receive Payment
                              </button>
                            )}
                            <button
                              type="button"
                              className="topbar-icon-btn"
                              style={{ color: '#ef4444' }}
                              onClick={() => setInvoiceToDelete(inv)}
                              title="Delete Invoice"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })

                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* ==================================================== */
        /* QUICK COUNTER SALE CHECKOUT WORKFLOW                 */
        /* ==================================================== */
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '20px', alignItems: 'start' }}>
          {/* LEFT COLUMN: Customer Information, Products Catalog & Custom Items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {/* 1. OPTIONAL CUSTOMER INFORMATION */}
            <div className="card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid var(--border-color)' }}>
                <User size={18} color="#2563eb" />
                <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                  1. Customer Details (Optional)
                </h3>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Customer Name</label>
                  <input
                    type="text"
                    className="input-control"
                    placeholder="Walk-in Client / Customer Name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Mobile Number</label>
                  <input
                    type="tel"
                    className="input-control"
                    placeholder="9876543210"
                    value={customerMobile}
                    onChange={(e) => setCustomerMobile(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* 2. PRODUCT CATALOG & QUICK ITEM ADDITION */}
            <div className="card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Package size={18} color="#2563eb" />
                  <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                    2. Accessories & Spare Parts Catalog
                  </h3>
                </div>

                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setShowCustomModal(true)}
                >
                  <Plus size={14} /> Add Custom Item
                </button>
              </div>

              {/* Category Filter Pills & Search */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', overflowX: 'auto', paddingBottom: '4px' }}>
                {categories.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`btn btn-sm ${activeCategory === c ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ whiteSpace: 'nowrap' }}
                    onClick={() => setActiveCategory(c)}
                  >
                    {c}
                  </button>
                ))}
              </div>

              <div className="input-wrapper" style={{ marginBottom: '14px', position: 'relative' }}>
                <span className="input-icon"><Search size={15} /></span>
                <input
                  type="text"
                  className="input-control input-with-icon"
                  placeholder="Quick search chargers, cables, tempered glass, covers, spares..."
                  value={searchQuery}
                  onChange={(e) => handleProductSearchChange(e.target.value)}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => handleProductSearchChange('')}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#94a3b8',
                      padding: '2px',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                    title="Clear search"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Quick Products Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '10px', maxHeight: '260px', overflowY: 'auto', paddingRight: '4px' }}>
                {filteredProducts.map((p) => {
                  const isOutOfStock = (p.quantity ?? 0) <= 0;
                  const isLowStock = (p.quantity ?? 0) > 0 && (p.quantity ?? 0) <= 3;
                  return (
                    <div
                      key={p.id}
                      onClick={() => addToCart(p)}
                      style={{
                        padding: '10px 12px',
                        borderRadius: 'var(--radius-md)',
                        border: isOutOfStock ? '1px dashed #fca5a5' : '1px solid var(--border-color)',
                        background: isOutOfStock ? '#fff5f5' : '#ffffff',
                        cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                        transition: 'all 0.15s ease',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        opacity: isOutOfStock ? 0.75 : 1,
                      }}
                      className="pos-catalog-item"
                    >
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '4px' }}>
                          <strong style={{ fontSize: '13px', color: '#0f172a', display: 'block', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', flex: 1 }}>
                            {p.name}
                          </strong>
                          {isOutOfStock ? (
                            <span style={{ fontSize: '9px', fontWeight: '800', color: '#dc2626', background: '#fee2e2', padding: '1px 5px', borderRadius: '4px', whiteSpace: 'nowrap' }}>
                              Out of Stock
                            </span>
                          ) : isLowStock ? (
                            <span style={{ fontSize: '9px', fontWeight: '800', color: '#d97706', background: '#fef3c7', padding: '1px 5px', borderRadius: '4px', whiteSpace: 'nowrap' }}>
                              Only {p.quantity} left
                            </span>
                          ) : (
                            <span style={{ fontSize: '9px', fontWeight: '700', color: '#059669', background: '#ecfdf5', padding: '1px 5px', borderRadius: '4px', whiteSpace: 'nowrap' }}>
                              {p.quantity} in stock
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>{p.category} • {p.brand}</div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                        <span style={{ fontSize: '13px', fontWeight: '800', color: '#2563eb' }}>{formatCurrency(p.price)}</span>
                        {isOutOfStock ? (
                          <span style={{ fontSize: '10px', fontWeight: '700', color: '#991b1b', background: '#fee2e2', padding: '2px 6px', borderRadius: '4px' }}>Unavailable</span>
                        ) : (
                          <span style={{ fontSize: '11px', fontWeight: '700', color: '#059669', background: '#ecfdf5', padding: '2px 8px', borderRadius: '4px' }}>+ Add</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 3. ADDITIONAL NOTES */}
            <div className="card" style={{ padding: '20px' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Sale Notes (Optional)</label>
                <input
                  type="text"
                  className="input-control"
                  placeholder="e.g. Counter cash sale / Customer copy provided"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Sale Cart & Settlement Desk */}
          <div style={{ position: 'sticky', top: '80px' }}>
            <div className="card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', paddingBottom: '10px', borderBottom: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Receipt size={18} color="#2563eb" />
                  <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                    Sale Cart Items ({cart.length})
                  </h3>
                </div>
                <span className="status-badge badge-blue" style={{ fontSize: '11px' }}>{cart.reduce((sum, i) => sum + i.qty, 0)} Units</span>
              </div>

              {/* Cart List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '240px', overflowY: 'auto', marginBottom: '14px' }}>
                {cart.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '28px 12px', background: '#f8fafc', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border-color)', color: '#94a3b8' }}>
                    <Package size={28} style={{ margin: '0 auto 6px', opacity: 0.6 }} />
                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#64748b' }}>Cart is empty</div>
                    <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>Click items from catalog or "+ Add Custom Item"</div>
                  </div>
                ) : (
                  cart.map((item) => (
                    <div
                      key={item.id}
                      style={{
                        padding: '10px',
                        background: '#f8fafc',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-md)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <strong style={{ fontSize: '12px', color: '#0f172a', display: 'block', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                          {item.name}
                        </strong>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#64748b' }}>
                          <span>{formatCurrency(item.price)} each</span>
                          {item.stock !== undefined && (
                            <span style={{ color: item.qty > item.stock ? '#dc2626' : '#059669', fontWeight: '600' }}>
                              • Stock: {item.stock}
                            </span>
                          )}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '2px', background: '#ffffff', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '1px' }}>
                          <button
                            type="button"
                            onClick={() => updateQty(item.id, -1)}
                            style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: '2px 5px', color: '#64748b' }}
                            title="Decrease quantity"
                          >
                            <Minus size={11} />
                          </button>
                          <input
                            type="number"
                            min="1"
                            value={item.qty}
                            onChange={(e) => setItemQty(item.id, e.target.value)}
                            style={{
                              width: '38px',
                              fontSize: '12px',
                              fontWeight: '700',
                              textAlign: 'center',
                              border: 'none',
                              background: 'transparent',
                              padding: '0',
                              outline: 'none',
                              color: '#0f172a',
                            }}
                            title="Quantity (click to edit)"
                          />
                          <button
                            type="button"
                            onClick={() => updateQty(item.id, 1)}
                            style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: '2px 5px', color: '#64748b' }}
                            title="Increase quantity"
                          >
                            <Plus size={11} />
                          </button>
                        </div>

                        <strong style={{ fontSize: '12px', color: '#0f172a', minWidth: '55px', textAlign: 'right' }}>
                          {formatCurrency(item.price * item.qty)}
                        </strong>

                        <button
                          type="button"
                          onClick={() => removeFromCart(item.id)}
                          style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#ef4444', padding: '4px' }}
                          title="Remove item"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Financial Calculation Summary */}
              <div style={{ background: '#f8fafc', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', marginBottom: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#64748b', marginBottom: '6px' }}>
                  <span>Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: '#64748b', marginBottom: '6px' }}>
                  <span>GST Tax Rate</span>
                  <select
                    className="select-control"
                    style={{ width: '80px', padding: '2px 6px', fontSize: '11px' }}
                    value={taxRate}
                    onChange={(e) => setTaxRate(e.target.value)}
                  >
                    <option value="0">0%</option>
                    <option value="5">5%</option>
                    <option value="12">12%</option>
                    <option value="18">18%</option>
                    <option value="28">28%</option>
                  </select>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: '#64748b', marginBottom: '8px' }}>
                  <span>Discount (₹)</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="input-control"
                    style={{ width: '80px', padding: '2px 6px', fontSize: '11px', textAlign: 'right' }}
                    value={discountAmount}
                    onChange={(e) => setDiscountAmount(e.target.value)}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px', fontWeight: '800', color: '#0f172a', borderTop: '1px solid var(--border-color)', paddingTop: '8px', marginTop: '4px' }}>
                  <span>Total Amount</span>
                  <span style={{ color: '#2563eb' }}>{formatCurrency(grandTotal)}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', fontWeight: '700', color: '#0f172a', marginTop: '8px' }}>
                  <span>Paid Amount (₹)</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="input-control"
                    placeholder={String(grandTotal)}
                    style={{ width: '100px', padding: '3px 8px', fontSize: '12px', textAlign: 'right', fontWeight: '700' }}
                    value={paidAmountInput}
                    onChange={(e) => setPaidAmountInput(e.target.value)}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: '800', color: due > 0 ? '#ea580c' : '#059669', marginTop: '8px', borderTop: '1px dashed var(--border-color)', paddingTop: '6px' }}>
                  <span>Amount Due</span>
                  <span>{formatCurrency(due)}</span>
                </div>
              </div>

              {/* Payment Method Selector */}
              <div style={{ marginBottom: '16px' }}>
                <label className="form-label" style={{ fontSize: '11px', marginBottom: '6px' }}>Payment Method</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                  {['UPI', 'Cash', 'Card', 'Bank Transfer'].map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setPaymentMode(mode)}
                      style={{
                        padding: '8px 4px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: '700',
                        border: paymentMode === mode ? '1.5px solid #2563eb' : '1px solid var(--border-color)',
                        background: paymentMode === mode ? '#eff6ff' : '#ffffff',
                        color: paymentMode === mode ? '#2563eb' : '#475569',
                        cursor: 'pointer',
                        textAlign: 'center',
                      }}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              {/* COMPLETE SALE BUTTON */}
              <button
                type="button"
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: '14px', fontWeight: '800' }}
                disabled={isSubmitting || cart.length === 0}
                onClick={handleCheckout}
              >
                {isSubmitting ? 'Processing Bill...' : `Complete Sale • ${formatCurrency(grandTotal)}`} <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Custom Item Modal */}
      {showCustomModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '16px',
          }}
        >
          <div className="card" style={{ maxWidth: '440px', width: '100%', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '800' }}>Add Custom Counter Item</h3>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowCustomModal(false)}>✕</button>
            </div>

            <form onSubmit={addCustomItemToCart}>
              <div className="form-group">
                <label className="form-label">Item / Product Name *</label>
                <input
                  type="text"
                  className="input-control"
                  placeholder="e.g. Type-C Fast Cable / Tempered Glass"
                  value={customItem.name}
                  onChange={(e) => setCustomItem({ ...customItem, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description (Optional)</label>
                <input
                  type="text"
                  className="input-control"
                  placeholder="e.g. Braided 65W Cable"
                  value={customItem.description}
                  onChange={(e) => setCustomItem({ ...customItem, description: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="form-group">
                  <label className="form-label">Unit Price (₹) *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="input-control"
                    placeholder="100"
                    value={customItem.price}
                    onChange={(e) => setCustomItem({ ...customItem, price: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Quantity *</label>
                  <input
                    type="number"
                    min="1"
                    className="input-control"
                    value={customItem.qty}
                    onChange={(e) => setCustomItem({ ...customItem, qty: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCustomModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Add to Cart</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Receipt Modal */}
      {receiptInvoice && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 200,
            padding: '16px',
            overflowY: 'auto',
          }}
        >
          <div style={{ maxWidth: '580px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <InvoiceReceiptView
              invoice={receiptInvoice}
              onClose={() => setReceiptInvoice(null)}
            />
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {invoiceToDelete && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 200,
            padding: '16px',
          }}
        >
          <div className="card" style={{ maxWidth: '400px', width: '100%', padding: '24px', textAlign: 'center' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: '#fef2f2',
                color: '#ef4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
              }}
            >
              <AlertTriangle size={24} />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>
              Delete Invoice?
            </h3>
            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '20px', lineHeight: 1.5 }}>
              Are you sure you want to delete invoice <strong>{invoiceToDelete.number}</strong> ({invoiceToDelete.customerName})?
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setInvoiceToDelete(null)}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                style={{ background: '#ef4444', borderColor: '#ef4444' }}
                onClick={handleDeleteInvoice}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receive Payment Modal */}
      {receivePaymentInvoice && (
        <ReceivePaymentModal
          invoice={receivePaymentInvoice}
          onClose={() => setReceivePaymentInvoice(null)}
          onSuccess={({ payment, invoice: updatedInvoice }) => {
            setReceivePaymentInvoice(null);
            loadInvoices();
            if (payment) {
              setPaymentReceiptData({ payment, invoice: updatedInvoice || receivePaymentInvoice });
            }
          }}
        />
      )}

      {/* Payment Receipt Modal */}
      {paymentReceiptData && (
        <PaymentReceiptModal
          paymentData={paymentReceiptData}
          onClose={() => setPaymentReceiptData(null)}
        />
      )}

      {/* Stock Availability Warning Confirmation Modal */}
      <StockValidationModal
        isOpen={stockWarningState.isOpen}
        item={stockWarningState.item}
        requestedQty={stockWarningState.requestedQty}
        availableStock={stockWarningState.availableStock}
        onConfirm={handleConfirmStockMax}
        onCancel={handleCancelStockWarning}
      />
    </MainLayout>
  );
};


