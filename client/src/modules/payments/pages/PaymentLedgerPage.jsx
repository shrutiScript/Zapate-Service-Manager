import React, { useState, useEffect } from 'react';
import { MainLayout } from '../../../components/layout/MainLayout.jsx';
import { KpiCards } from '../../../components/ui/KpiCard/index.js';
import { formatCurrency, formatDate } from '../../../utils/formatters.js';
import {
  Plus,
  Search,
  DollarSign,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  CreditCard,
  ArrowUpRight,
  ArrowDownLeft,
  Inbox,
  Filter,
  Receipt,
  User,
  ArrowRight,
  Eye,
  Clock,
  Package,
  FileText,
} from 'lucide-react';
import { toast } from 'sonner';
import api from '../../../services/api.js';
import { ReceivePaymentModal } from '../components/ReceivePaymentModal.jsx';
import { PaymentReceiptModal } from '../components/PaymentReceiptModal.jsx';
import { InvoiceReceiptView } from '../../pos/components/InvoiceReceiptView.jsx';

export const PaymentLedgerPage = () => {
  const [activeTab, setActiveTab] = useState('due_invoices'); // 'due_invoices' | 'vouchers'
  const [invoices, setInvoices] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [dueSummary, setDueSummary] = useState({
    totalOutstandingDue: 0,
    partiallyPaidCount: 0,
    unpaidCount: 0,
    todayCollections: 0,
    totalInvoicesCount: 0,
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('DUE_ONLY'); // 'DUE_ONLY' | 'ALL' | 'PAID' | 'PARTIALLY_PAID' | 'UNPAID'
  const [typeFilter, setTypeFilter] = useState('ALL'); // 'ALL' | 'UPI' | 'Cash' | 'Card' | 'Bank Transfer'

  const [isLoading, setIsLoading] = useState(true);

  // Modals state
  const [receivePaymentInvoice, setReceivePaymentInvoice] = useState(null);
  const [paymentReceiptData, setPaymentReceiptData] = useState(null);
  const [viewInvoiceModal, setViewInvoiceModal] = useState(null);

  const loadData = () => {
    setIsLoading(true);

    api.get('/payments/due-summary')
      .then((res) => {
        if (res && res.totalOutstandingDue !== undefined) {
          setDueSummary(res);
        }
      })
      .catch(() => {});

    api.get('/pos/invoices')
      .then((res) => {
        if (Array.isArray(res)) {
          setInvoices(res);
        } else {
          setInvoices([]);
        }
      })
      .catch(() => setInvoices([]));

    api.get('/payments/ledger')
      .then((res) => {
        if (Array.isArray(res)) {
          const mapped = res.map((t, i) => ({
            id: t._id || t.id || t.txnId || `TXN-90${22 + i}`,
            transactionNumber: t.transactionNumber || t.id || `TXN-90${22 + i}`,
            customer: t.customerName || (typeof t.customer === 'object' ? t.customer?.name : t.customer) || 'Walk-in Client',
            ref: t.invoiceNumber || t.jobCardId || t.reference || t.notes || 'Settlement',
            paymentMethod: t.paymentMethod || t.method || t.type || 'UPI',
            type: t.type || 'Credit',
            amount: t.amount || t.credit || 0,
            balanceAfter: t.balanceAfter || t.remainingDue || 0,
            date: t.createdAt ? new Date(t.createdAt).toLocaleDateString('en-GB') : 'Recent',
            time: t.createdAt ? new Date(t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
            notes: t.notes || '',
          }));
          setTransactions(mapped);
        } else {
          setTransactions([]);
        }
      })
      .catch(() => setTransactions([]))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handlePaymentSuccess = ({ payment, invoice: updatedInvoice }) => {
    setReceivePaymentInvoice(null);
    loadData();
    if (payment) {
      setPaymentReceiptData({ payment, invoice: updatedInvoice });
    }
  };

  const filteredInvoices = invoices.filter((inv) => {
    const q = searchQuery.toLowerCase();
    const matchesQ =
      (inv.number || '').toLowerCase().includes(q) ||
      (inv.orderId || '').toLowerCase().includes(q) ||
      (inv.customerName || '').toLowerCase().includes(q) ||
      (inv.customerMobile || '').toLowerCase().includes(q) ||
      (inv.deviceModel || '').toLowerCase().includes(q);

    const totalAmt = Number(inv.total) || 0;
    const paidAmt = Number(inv.paidAmount !== undefined ? inv.paidAmount : totalAmt);
    const dueAmt = Math.max(0, Number(inv.dueAmount !== undefined ? inv.dueAmount : totalAmt - paidAmt));
    
    let rawStatus = (inv.status || 'PAID').toUpperCase();
    if (rawStatus !== 'CANCELLED') {
      if (dueAmt <= 0) rawStatus = 'PAID';
      else if (paidAmt > 0) rawStatus = 'PARTIALLY PAID';
      else rawStatus = 'UNPAID';
    }

    if (statusFilter === 'DUE_ONLY') {
      return matchesQ && dueAmt > 0 && rawStatus !== 'CANCELLED';
    } else if (statusFilter === 'PAID') {
      return matchesQ && rawStatus === 'PAID';
    } else if (statusFilter === 'PARTIALLY_PAID') {
      return matchesQ && rawStatus === 'PARTIALLY PAID';
    } else if (statusFilter === 'UNPAID') {
      return matchesQ && rawStatus === 'UNPAID';
    }
    return matchesQ;
  });

  const filteredTxns = transactions.filter((t) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      (t.customer || '').toLowerCase().includes(q) ||
      (t.transactionNumber || '').toLowerCase().includes(q) ||
      (t.ref || '').toLowerCase().includes(q) ||
      (t.notes || '').toLowerCase().includes(q);

    const matchesType = typeFilter === 'ALL' || t.paymentMethod === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <MainLayout title="Payments & Due Management" subtitle="Outstanding Receivables & Settlement History">
      <div className="page-header">
        <div className="page-header-info">
          <div className="page-badge-eyebrow">
            <span /> FINANCIAL DUE MANAGEMENT
          </div>
          <h1>Payments & Due Management</h1>
          <p>Track client outstanding dues, issue partial payment settlements, and audit payment receipts.</p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            className={activeTab === 'due_invoices' ? 'btn btn-primary' : 'btn btn-secondary'}
            onClick={() => setActiveTab('due_invoices')}
          >
            <DollarSign size={16} /> Due Balances ({invoices.filter(i => (i.dueAmount || 0) > 0).length})
          </button>
          <button
            type="button"
            className={activeTab === 'vouchers' ? 'btn btn-primary' : 'btn btn-secondary'}
            onClick={() => setActiveTab('vouchers')}
          >
            <Receipt size={16} /> Settlement Receipts ({transactions.length})
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <KpiCards
        columns={4}
        items={[
          {
            icon: <AlertCircle size={22} />,
            label: 'Total Outstanding Due',
            value: formatCurrency(dueSummary.totalOutstandingDue),
            color: 'red',
            accent: true,
            valueColor: dueSummary.totalOutstandingDue > 0 ? '#dc2626' : undefined,
            sub: 'Pending client receivables',
          },
          {
            icon: <Clock size={22} />,
            label: 'Partially Paid Invoices',
            value: dueSummary.partiallyPaidCount,
            color: 'amber',
            accent: true,
            sub: 'Partial advance received',
          },
          {
            icon: <DollarSign size={22} />,
            label: 'Unpaid Invoices',
            value: dueSummary.unpaidCount,
            color: 'orange',
            accent: true,
            valueColor: dueSummary.unpaidCount > 0 ? '#ea580c' : undefined,
            sub: 'Zero payment collected',
          },
          {
            icon: <TrendingUp size={22} />,
            label: "Today's Collections",
            value: formatCurrency(dueSummary.todayCollections),
            color: 'emerald',
            accent: true,
            valueColor: '#059669',
            sub: 'Settled today',
          },
        ]}
      />

      {activeTab === 'due_invoices' ? (
        /* OUTSTANDING INVOICES DUE TAB */
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {[
                { label: 'Outstanding Dues Only', val: 'DUE_ONLY' },
                { label: 'All Invoices', val: 'ALL' },
                { label: 'Partially Paid', val: 'PARTIALLY_PAID' },
                { label: 'Unpaid', val: 'UNPAID' },
                { label: 'Paid', val: 'PAID' },
              ].map((opt) => (
                <button
                  key={opt.val}
                  type="button"
                  className={`btn btn-sm ${statusFilter === opt.val ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setStatusFilter(opt.val)}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <div className="input-wrapper" style={{ width: '320px' }}>
              <span className="input-icon"><Search size={15} /></span>
              <input
                type="text"
                className="input-control input-with-icon"
                placeholder="Search customer, phone, Invoice #..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
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
                  <th>Details / Device</th>
                  <th>Total Amount</th>
                  <th>Payment Summary</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', padding: '32px', color: '#94a3b8' }}>
                      Loading invoice dues...
                    </td>
                  </tr>
                ) : filteredInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', padding: '48px 20px', color: '#94a3b8' }}>
                      <CheckCircle size={32} style={{ margin: '0 auto 8px', color: '#059669', opacity: 0.8 }} />
                      <div style={{ fontWeight: '700', color: '#0f172a' }}>No outstanding dues match criteria!</div>
                      <div style={{ fontSize: '12px' }}>All client invoices are fully settled or match selected filters.</div>
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
                    const isPartialStatus = rawStatus === 'PARTIALLY PAID';
                    const isUnpaidStatus = rawStatus === 'UNPAID';

                    return (
                      <tr key={inv._id || inv.id}>
                        <td>
                          <span className={`status-badge ${isRepair ? 'badge-blue' : 'badge-green'}`} style={{ fontSize: '10px' }}>
                            {isRepair ? 'Repair Invoice' : 'Quick Sale'}
                          </span>
                        </td>
                        <td>
                          <strong style={{ color: '#0f172a', fontFamily: 'JetBrains Mono' }}>{inv.number}</strong>
                          {inv.orderId && <div style={{ fontSize: '11px', color: '#64748b' }}>{inv.orderId}</div>}
                        </td>
                        <td>
                          <div style={{ fontSize: '12px', color: '#0f172a' }}>{formatDate(inv.createdAt)}</div>
                        </td>
                        <td>
                          <strong style={{ color: '#0f172a' }}>{inv.customerName || 'Walk-in Client'}</strong>
                          {inv.customerMobile && <div style={{ fontSize: '11px', color: '#64748b' }}>{inv.customerMobile}</div>}
                        </td>
                        <td>
                          {isRepair ? (
                            <div>
                              <strong style={{ fontSize: '12px', color: '#2563eb' }}>{inv.deviceModel || 'Mobile Repair'}</strong>
                            </div>
                          ) : (
                            <div style={{ fontSize: '12px', color: '#334155' }}>
                              {inv.items?.map((item) => `${item.name} (${item.quantity})`).join(', ') || 'Counter items'}
                            </div>
                          )}
                        </td>
                        <td>
                          <strong style={{ fontSize: '13px', color: '#0f172a' }}>{formatCurrency(totalAmt)}</strong>
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
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                            <button
                              type="button"
                              className="btn btn-sm btn-secondary"
                              onClick={() => setViewInvoiceModal(inv)}
                              title="View Invoice"
                            >
                              <Eye size={13} /> View Invoice
                            </button>
                            {dueAmt > 0 && rawStatus !== 'CANCELLED' && (
                              <button
                                type="button"
                                className="btn btn-sm btn-primary"
                                style={{ background: '#059669', borderColor: '#059669' }}
                                onClick={() => setReceivePaymentInvoice(inv)}
                                title="Receive Payment"
                              >
                                <DollarSign size={13} /> Receive Payment
                              </button>
                            )}
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
        /* SETTLEMENT VOUCHERS TAB */
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              {['ALL', 'UPI', 'Cash', 'Card', 'Bank Transfer'].map((mode) => (
                <button
                  key={mode}
                  type="button"
                  className={`btn btn-sm ${typeFilter === mode ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setTypeFilter(mode)}
                >
                  {mode}
                </button>
              ))}
            </div>

            <div className="input-wrapper" style={{ width: '320px' }}>
              <span className="input-icon"><Search size={15} /></span>
              <input
                type="text"
                className="input-control input-with-icon"
                placeholder="Search customer, TXN / Receipt #..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="table-container">
            <table className="pro-table">
              <thead>
                <tr>
                  <th>Receipt #</th>
                  <th>Customer Account</th>
                  <th>Reference / Invoice</th>
                  <th>Method</th>
                  <th>Amount Received</th>
                  <th>Date & Time</th>
                </tr>
              </thead>
              <tbody>
                {filteredTxns.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: '#94a3b8' }}>
                      {isLoading ? 'Loading settlement vouchers...' : 'No payment records match your search.'}
                    </td>
                  </tr>
                ) : (
                  filteredTxns.map((t) => (
                    <tr key={t.id}>
                      <td>
                        <strong style={{ fontFamily: 'JetBrains Mono', color: '#2563eb', fontSize: '12px' }}>
                          {t.transactionNumber}
                        </strong>
                      </td>
                      <td>
                        <strong style={{ color: '#0f172a' }}>{t.customer}</strong>
                      </td>
                      <td>
                        <span style={{ fontSize: '12px', color: '#475569' }}>{t.ref}</span>
                        {t.notes && t.notes !== t.ref && <div style={{ fontSize: '10px', color: '#94a3b8' }}>{t.notes}</div>}
                      </td>
                      <td>
                        <span className="status-badge badge-blue">{t.paymentMethod}</span>
                      </td>
                      <td>
                        <strong style={{ color: '#059669', fontSize: '13px' }}>
                          +{formatCurrency(t.amount)}
                        </strong>
                      </td>
                      <td>
                        <div style={{ fontSize: '12px', color: '#334155' }}>{t.date}</div>
                        {t.time && <div style={{ fontSize: '10px', color: '#94a3b8' }}>{t.time}</div>}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Receive Payment Modal */}
      {receivePaymentInvoice && (
        <ReceivePaymentModal
          invoice={receivePaymentInvoice}
          onClose={() => setReceivePaymentInvoice(null)}
          onSuccess={handlePaymentSuccess}
        />
      )}

      {/* View Payment Receipt Modal */}
      {paymentReceiptData && (
        <PaymentReceiptModal
          paymentData={paymentReceiptData}
          onClose={() => setPaymentReceiptData(null)}
        />
      )}

      {/* View Full Invoice Receipt Modal */}
      {viewInvoiceModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <div className="card" style={{ maxWidth: '680px', width: '100%', padding: '0', background: '#ffffff', borderRadius: '12px', overflow: 'hidden', maxHeight: '90vh' }}>
            <InvoiceReceiptView invoice={viewInvoiceModal} onClose={() => setViewInvoiceModal(null)} />
          </div>
        </div>
      )}
    </MainLayout>
  );
};

