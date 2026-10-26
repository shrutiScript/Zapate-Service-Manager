import React, { useState, useEffect, useRef } from 'react';
import { MainLayout } from '../../../components/layout/MainLayout.jsx';
import { KpiCards } from '../../../components/ui/KpiCard/index.js';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  Search,
  Plus,
  Calendar,
  Clock,
  User,
  Phone,
  Smartphone,
  Wrench,
  FileText,
  Printer,
  Ban,
  CheckCircle2,
  AlertTriangle,
  X,
  Lock,
  DollarSign,
  Receipt,
  Download,
  Award,
  BadgeCheck,
  MapPin,
  Mail,
  Check,
} from 'lucide-react';
import { toast } from 'sonner';
import html2pdf from 'html2pdf.js';
import { formatCurrency } from '../../../utils/formatters.js';
import { BarcodeGenerator } from '../../../components/common/BarcodeGenerator.jsx';
import { useAuth } from '../../../context/AuthContext.jsx';
import { useApp } from '../../../context/AppContext.jsx';
import api from '../../../services/api.js';

const sanitizeText = (val) => {
  if (!val) return '';
  if (typeof val === 'function') return '';
  if (typeof val === 'object') {
    if (val.model && typeof val.model === 'string') return sanitizeText(val.model);
    if (val.name && typeof val.name === 'string') return sanitizeText(val.name);
    if (val.brand && typeof val.brand === 'string') return sanitizeText(val.brand);
    return '';
  }
  const str = String(val).trim();
  if (str.startsWith('function') || str.includes('=>') || str.includes('{')) return '';
  return str;
};

const formatDevice = (item) => {
  if (!item) return 'Mobile Device';
  const brand = sanitizeText(item.deviceBrand || item.brand || (typeof item.device === 'object' ? item.device?.brand : ''));
  const model = sanitizeText(item.deviceModel || item.model || (typeof item.device === 'object' ? item.device?.model : ''));

  if (brand && model) return `${brand} ${model}`;
  if (model) return model;
  if (brand) return brand;
  if (typeof item.device === 'string' && sanitizeText(item.device)) return sanitizeText(item.device);
  return 'Mobile Device';
};

const formatCustomer = (item) => {
  if (!item) return 'Client';
  const name = sanitizeText(item.customerName || item.customer || (typeof item.customer === 'object' ? item.customer?.name : ''));
  return name || 'Client';
};

export const WarrantyListPage = () => {
  const { currentShop, user } = useAuth();
  const { searchQuery: globalSearchQuery, setSearchQuery: setGlobalSearchQuery } = useApp();
  const certificateRef = useRef(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const [warranties, setWarranties] = useState([]);
  const [searchQuery, setSearchQuery] = useState(globalSearchQuery || '');

  useEffect(() => {
    if (globalSearchQuery !== undefined) {
      setSearchQuery(globalSearchQuery);
    }
  }, [globalSearchQuery]);

  const handleSearchChange = (val) => {
    setSearchQuery(val);
    setGlobalSearchQuery(val);
  };
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);

  // Selected warranty for Certificate Detail Modal
  const [selectedWarranty, setSelectedWarranty] = useState(null);

  // Void Warranty Modal
  const [voidModalItem, setVoidModalItem] = useState(null);
  const [voidReason, setVoidReason] = useState('');
  const [isVoiding, setIsVoiding] = useState(false);

  // Generate Warranty from Completed Repair Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [completedRepairs, setCompletedRepairs] = useState([]);
  const [selectedRepairId, setSelectedRepairId] = useState('');
  const [warrantyOption, setWarrantyOption] = useState('30'); // '0' | '7' | '15' | '30' | '60' | '90' | 'custom'
  const [customDays, setCustomDays] = useState('45');
  const [warrantyTerms, setWarrantyTerms] = useState('Standard Workshop Hardware Warranty');
  const [isCreating, setIsCreating] = useState(false);

  // Handle Clean Browser Print
  const handlePrintCertificate = () => {
    if (!selectedWarranty) return;
    const originalTitle = document.title;
    document.title = `Warranty-Certificate-${selectedWarranty.repairNumber || 'ZSM'}`;
    window.print();
    setTimeout(() => {
      document.title = originalTitle;
    }, 1200);
  };

  // Handle High Resolution PDF Download
  const handleDownloadPdf = async () => {
    if (!certificateRef.current || !selectedWarranty) return;
    setIsGeneratingPdf(true);
    toast.loading('Preparing official warranty certificate PDF...', { id: 'warranty-pdf-toast' });

    try {
      const element = certificateRef.current;
      const opt = {
        margin: [6, 6, 6, 6],
        filename: `Warranty-Certificate-${selectedWarranty.repairNumber}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      };

      await html2pdf().set(opt).from(element).save();
      toast.success(`Warranty Certificate #${selectedWarranty.repairNumber} downloaded!`, { id: 'warranty-pdf-toast' });
    } catch (err) {
      console.error('[WarrantyListPage] PDF download error:', err);
      toast.error('Could not auto-download PDF. You can also click Print → Save as PDF.', { id: 'warranty-pdf-toast' });
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const loadWarranties = () => {
    setIsLoading(true);
    api.get(`/warranties?search=${encodeURIComponent(searchQuery)}&status=${statusFilter}`)
      .then((res) => {
        if (Array.isArray(res)) setWarranties(res);
        else setWarranties([]);
      })
      .catch(() => setWarranties([]))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadWarranties();
  }, [searchQuery, statusFilter]);

  const loadCompletedRepairs = () => {
    api.get('/repairs')
      .then((res) => {
        if (Array.isArray(res)) {
          const completed = res.filter(
            (r) => r.status === 'Completed' || r.status === 'Delivered' || r.status === 'Ready for Pickup'
          ).map((r) => {
            const total = Number(r.finalAmount || r.estimatedAmount || r.amount || 0);
            const paid = Number(r.advancePayment || r.advance || 0);
            const due = Math.max(0, total - paid);
            return {
              ...r,
              totalAmount: total,
              paidAmount: paid,
              dueAmount: due,
              paymentStatus: due <= 0 && total > 0 ? 'PAID' : (paid > 0 ? 'PARTIAL' : 'PENDING'),
              warrantyEligible: due <= 0,
            };
          });
          setCompletedRepairs(completed);
          if (completed.length > 0) setSelectedRepairId(completed[0]._id);
        }
      })
      .catch(() => setCompletedRepairs([]));
  };

  const handleOpenCreateModal = () => {
    loadCompletedRepairs();
    setIsCreateModalOpen(true);
  };

  const handleGenerateWarranty = async (e) => {
    e.preventDefault();
    if (!selectedRepairId) {
      toast.error('Please select a completed repair job.');
      return;
    }

    const selectedRepair = completedRepairs.find((r) => String(r._id) === String(selectedRepairId));
    if (selectedRepair && selectedRepair.dueAmount > 0) {
      toast.error(`Warranty certificate cannot be generated because full payment is pending. Remaining Due: ${formatCurrency(selectedRepair.dueAmount)}`);
      return;
    }

    const days = warrantyOption === 'custom' ? Number(customDays) || 30 : Number(warrantyOption);

    setIsCreating(true);
    try {
      await api.post(`/warranties/from-repair/${selectedRepairId}`, {
        serviceWarrantyDays: days,
        partsWarrantyDays: days,
        terms: warrantyTerms.trim(),
      });
      toast.success('Warranty certificate created successfully!');
      setIsCreateModalOpen(false);
      loadWarranties();
    } catch (err) {
      toast.error(err.message || 'Warranty certificate cannot be generated because full payment is pending.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleConfirmVoid = async (e) => {
    e.preventDefault();
    if (!voidModalItem) return;

    setIsVoiding(true);
    try {
      await api.post(`/warranties/${voidModalItem._id}/void`, {
        reason: voidReason.trim(),
      });
      toast.success(`Warranty #${voidModalItem.repairNumber} marked as VOID.`);
      setVoidModalItem(null);
      setVoidReason('');
      loadWarranties();
    } catch (err) {
      toast.error(err.message || 'Failed to void warranty');
    } finally {
      setIsVoiding(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'ACTIVE':
        return <span className="status-badge badge-green">ACTIVE ✓</span>;
      case 'EXPIRING_SOON':
        return <span className="status-badge badge-amber">EXPIRING SOON</span>;
      case 'EXPIRED':
        return <span className="status-badge badge-red" style={{ background: '#fee2e2', color: '#991b1b' }}>EXPIRED</span>;
      case 'VOID':
        return <span className="status-badge" style={{ background: '#475569', color: '#ffffff' }}>VOID</span>;
      default:
        return <span className="status-badge badge-blue">{status}</span>;
    }
  };

  const getPaymentBadge = (w) => {
    const due = Number(w.dueAmount || 0);
    const paid = Number(w.paidAmount || 0);
    const isPaid = due <= 0 || w.paymentStatus === 'PAID' || w.warrantyEligible;

    if (isPaid) {
      return <span className="status-badge badge-green">PAID ✓</span>;
    }
    if (paid > 0) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <span className="status-badge badge-amber" style={{ width: 'fit-content' }}>PARTIAL</span>
          <span style={{ fontSize: '11px', color: '#ea580c', fontWeight: '700' }}>
            Due: {formatCurrency(due)}
          </span>
        </div>
      );
    }
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        <span className="status-badge badge-red" style={{ width: 'fit-content' }}>PENDING</span>
        <span style={{ fontSize: '11px', color: '#dc2626', fontWeight: '700' }}>
          Due: {formatCurrency(due)}
        </span>
      </div>
    );
  };

  const selectedRepairObject = completedRepairs.find((r) => String(r._id) === String(selectedRepairId));

  return (
    <MainLayout title="Warranty Management" subtitle="Payment-Verified Repair Coverage & Certificates">
      <div className="page-header">
        <div className="page-header-info">
          <div className="page-badge-eyebrow">
            <span /> COVERAGE & PAYMENT VERIFICATION
          </div>
          <h1>Warranty Management</h1>
          <p>Generate, view, and issue warranty certificates for fully paid repair jobs.</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={handleOpenCreateModal}>
          <Plus size={16} /> Issue Repair Warranty
        </button>
      </div>

      {/* KPI Cards */}
      <KpiCards
        columns={4}
        items={[
          {
            icon: <Shield size={22} />,
            label: 'Total Warranties',
            value: warranties.length,
            color: 'blue',
            accent: true,
            sub: 'Issued coverage policies',
          },
          {
            icon: <ShieldCheck size={22} />,
            label: 'Active Coverage',
            value: warranties.filter((w) => !w.status || w.status === 'ACTIVE').length,
            color: 'emerald',
            accent: true,
            delta: 'Protected',
            deltaColor: '#059669',
            sub: 'Valid repair guarantees',
          },
          {
            icon: <AlertTriangle size={22} />,
            label: 'Expiring Soon',
            value: warranties.filter((w) => w.status === 'EXPIRING_SOON').length,
            color: 'amber',
            accent: true,
            valueColor: warranties.some((w) => w.status === 'EXPIRING_SOON') ? '#d97706' : undefined,
            sub: 'Within 7-day window',
          },
          {
            icon: <ShieldAlert size={22} />,
            label: 'Expired / Void',
            value: warranties.filter((w) => w.status === 'EXPIRED' || w.status === 'VOID').length,
            color: 'red',
            accent: true,
            sub: 'Lapsed or cancelled',
          },
        ]}
      />

      {/* Filter & Search Bar */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '14px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="input-wrapper" style={{ flex: 1, minWidth: '260px', position: 'relative' }}>
            <span className="input-icon">
              <Search size={15} />
            </span>
            <input
              type="text"
              className="input-control input-with-icon"
              placeholder="Search warranty by customer, phone, ticket #, IMEI..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => handleSearchChange('')}
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

          <div style={{ display: 'flex', gap: '6px' }}>
            {['ALL', 'ACTIVE', 'EXPIRING_SOON', 'EXPIRED', 'VOID'].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '700',
                  border: 'none',
                  cursor: 'pointer',
                  background: statusFilter === st ? '#2563eb' : '#f1f5f9',
                  color: statusFilter === st ? '#ffffff' : '#64748b',
                }}
              >
                {st.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Warranty Records Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-container">
          <table className="pro-table">
            <thead>
              <tr>
                <th>Ticket / Job</th>
                <th>Client & Contact</th>
                <th>Device Details</th>
                <th>Payment Status</th>
                <th>Coverage Duration</th>
                <th>Warranty Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: '#94a3b8' }}>
                    Loading warranty records...
                  </td>
                </tr>
              ) : warranties.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: '#94a3b8' }}>
                    No warranty records found matching criteria.
                  </td>
                </tr>
              ) : (
                warranties.map((w) => {
                  const startDateStr = new Date(w.startDate || Date.now()).toLocaleDateString('en-GB');
                  const expiryDateStr = new Date(w.expiryDate || Date.now()).toLocaleDateString('en-GB');
                  const isEligible = w.dueAmount <= 0 || w.paymentStatus === 'PAID' || w.warrantyEligible;

                  return (
                    <tr key={w._id}>
                      <td>
                        <strong style={{ color: '#2563eb' }}>{w.repairNumber}</strong>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>Issued: {startDateStr}</div>
                      </td>
                      <td>
                        <strong style={{ color: '#0f172a' }}>{formatCustomer(w)}</strong>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>{w.customerMobile}</div>
                      </td>
                      <td>
                        <strong style={{ color: '#1e293b' }}>
                          {formatDevice(w)}
                        </strong>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>
                          IMEI: {w.imei || 'N/A'}
                        </div>
                      </td>
                      <td>{getPaymentBadge(w)}</td>
                      <td>
                        <span style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>
                          {w.serviceWarrantyDays > 0 ? `${w.serviceWarrantyDays} Days` : 'No Warranty'}
                        </span>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>Expires: {expiryDateStr}</div>
                      </td>
                      <td>
                        {isEligible ? (
                          getStatusBadge(w.status)
                        ) : (
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: '700',
                              padding: '3px 8px',
                              borderRadius: '6px',
                              background: '#fff7ed',
                              color: '#ea580c',
                              border: '1px solid #ffedd5',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <Lock size={12} /> Locked 🔒
                          </span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            {isEligible ? (
                              <button
                                type="button"
                                className="btn btn-primary btn-sm"
                                title="Generate / View Certificate"
                                onClick={() => setSelectedWarranty(w)}
                              >
                                <FileText size={13} /> Generate Warranty Certificate
                              </button>
                            ) : (
                              <button
                                type="button"
                                className="btn btn-secondary btn-sm"
                                disabled
                                style={{ opacity: 0.6, cursor: 'not-allowed', background: '#f1f5f9', color: '#94a3b8' }}
                                title="Warranty certificate will be available after full payment is completed."
                              >
                                <Lock size={13} /> Locked
                              </button>
                            )}

                            {w.status !== 'VOID' && (
                              <button
                                type="button"
                                className="btn btn-secondary btn-sm"
                                style={{ color: '#ef4444', borderColor: '#fca5a5' }}
                                title="Void Warranty"
                                onClick={() => setVoidModalItem(w)}
                              >
                                <Ban size={13} /> Void
                              </button>
                            )}
                          </div>
                          {!isEligible && (
                            <span style={{ fontSize: '10px', color: '#ea580c', fontWeight: '500' }}>
                              Available after full payment
                            </span>
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

      {/* VIEW WARRANTY CERTIFICATE MODAL */}
      {selectedWarranty && (
        <div
          className="warranty-modal-overlay"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.82)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-start',
            zIndex: 1000,
            padding: '20px 16px',
            overflowY: 'auto',
          }}
        >
          {/* Certificate Print & PDF CSS */}
          <style>{`
            @media print {
              @page {
                size: A4 portrait;
                margin: 8mm;
              }
              html, body {
                margin: 0 !important;
                padding: 0 !important;
                background: #ffffff !important;
                color: #0f172a !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              .app-shell,
              .sidebar,
              .header,
              nav,
              aside,
              header,
              footer,
              .no-print,
              .no-print * {
                display: none !important;
                visibility: hidden !important;
              }
              .warranty-modal-overlay {
                position: static !important;
                background: transparent !important;
                padding: 0 !important;
                margin: 0 !important;
                display: block !important;
                width: 100% !important;
                height: auto !important;
                overflow: visible !important;
                backdrop-filter: none !important;
              }
              #printable-warranty-certificate {
                display: block !important;
                visibility: visible !important;
                width: 100% !important;
                max-width: 100% !important;
                margin: 0 auto !important;
                padding: 16px 20px !important;
                box-shadow: none !important;
                border: 3px double #1e3a8a !important;
                background: #ffffff !important;
                page-break-inside: avoid !important;
              }
              #printable-warranty-certificate * {
                visibility: visible !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
            }
          `}</style>

          {/* SCREEN ACTION TOOLBAR (Hidden on Print) */}
          <div
            className="no-print"
            style={{
              maxWidth: '780px',
              width: '100%',
              background: '#0f172a',
              borderRadius: '12px',
              padding: '12px 20px',
              marginBottom: '16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              border: '1px solid #334155',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(56, 189, 248, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShieldCheck size={22} style={{ color: '#38bdf8' }} />
              </div>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#ffffff', margin: 0, letterSpacing: '0.3px' }}>
                  Official Repair Warranty Certificate
                </h3>
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                  Ticket #{selectedWarranty.repairNumber} {selectedWarranty.invoiceNumber !== 'N/A' && `• Invoice ${selectedWarranty.invoiceNumber}`}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleDownloadPdf}
                disabled={isGeneratingPdf}
                style={{
                  background: '#1e293b',
                  color: '#f8fafc',
                  border: '1px solid #475569',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 14px',
                  borderRadius: '7px',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: isGeneratingPdf ? 'wait' : 'pointer',
                }}
              >
                <Download size={14} style={{ color: '#38bdf8' }} />
                {isGeneratingPdf ? 'Generating PDF...' : 'Download PDF'}
              </button>

              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={handlePrintCertificate}
                style={{
                  background: '#2563eb',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 16px',
                  borderRadius: '7px',
                  fontSize: '12px',
                  fontWeight: '700',
                  boxShadow: '0 2px 8px rgba(37, 99, 235, 0.4)',
                }}
              >
                <Printer size={14} /> Print Certificate
              </button>

              <button
                type="button"
                onClick={() => setSelectedWarranty(null)}
                style={{
                  background: '#334155',
                  border: 'none',
                  color: '#cbd5e1',
                  cursor: 'pointer',
                  width: '32px',
                  height: '32px',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginLeft: '4px',
                }}
                title="Close Modal"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* OFFICIAL A4 PRINTABLE WARRANTY CERTIFICATE SHEET */}
          <div
            id="printable-warranty-certificate"
            ref={certificateRef}
            style={{
              maxWidth: '780px',
              width: '100%',
              background: '#ffffff',
              color: '#0f172a',
              borderRadius: '8px',
              border: '3px double #1e3a8a',
              padding: '28px 32px',
              position: 'relative',
              boxShadow: '0 20px 35px -10px rgba(0, 0, 0, 0.4)',
              boxSizing: 'border-box',
            }}
          >
            {/* INNER BORDER ORNAMENTATION */}
            <div
              style={{
                border: '1px solid #bfdbfe',
                borderRadius: '6px',
                padding: '22px 24px',
                background: '#ffffff',
                position: 'relative',
              }}
            >
              {/* 1. TOP HEADER: WORKSHOP AUTHORITY & CREDENTIALS */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  paddingBottom: '16px',
                  borderBottom: '2px solid #1e3a8a',
                  marginBottom: '16px',
                  gap: '16px',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <ShieldCheck size={24} style={{ color: '#1e3a8a' }} />
                    <h2
                      style={{
                        fontSize: '20px',
                        fontWeight: '900',
                        color: '#1e3a8a',
                        textTransform: 'uppercase',
                        letterSpacing: '0.8px',
                        margin: 0,
                      }}
                    >
                      {currentShop?.name || user?.shopName || 'Zapate Service Manager Service Center'}
                    </h2>
                  </div>
                  <div style={{ fontSize: '11px', color: '#475569', fontWeight: '600' }}>
                    {currentShop?.businessType || 'Certified Electronics & Mobile Repair Workshop'}
                  </div>
                  {(currentShop?.shopContactNumber || currentShop?.phone || currentShop?.ownerMobile || currentShop?.address) && (
                    <div style={{ fontSize: '10px', color: '#64748b', marginTop: '3px', lineHeight: '1.4' }}>
                      {[
                        (currentShop?.shopContactNumber || currentShop?.phone || currentShop?.ownerMobile) ? `Tel: ${currentShop?.shopContactNumber || currentShop?.phone || currentShop?.ownerMobile}` : '',
                        currentShop?.address || '',
                        currentShop?.gstNumber ? `GSTIN: ${currentShop.gstNumber}` : '',
                      ].filter(Boolean).join(' • ')}
                    </div>
                  )}
                </div>

                <div style={{ textAlign: 'right', minWidth: '180px' }}>
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      background: '#eff6ff',
                      color: '#1d4ed8',
                      padding: '3px 10px',
                      borderRadius: '4px',
                      fontSize: '10px',
                      fontWeight: '800',
                      letterSpacing: '0.5px',
                      border: '1px solid #bfdbfe',
                      marginBottom: '6px',
                    }}
                  >
                    <Award size={12} /> CERTIFICATE OF WARRANTY
                  </div>
                  <div style={{ fontSize: '11px', fontWeight: '800', color: '#0f172a' }}>
                    WCK-{selectedWarranty.repairNumber}
                  </div>
                  <div style={{ fontSize: '10px', color: '#64748b' }}>
                    Issued: {new Date(selectedWarranty.startDate || Date.now()).toLocaleDateString('en-GB')}
                  </div>
                  <div style={{ marginTop: '4px' }}>
                    <span
                      style={{
                        display: 'inline-block',
                        fontSize: '10px',
                        fontWeight: '800',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        background: selectedWarranty.status === 'VOID' ? '#fee2e2' : '#dcfce7',
                        color: selectedWarranty.status === 'VOID' ? '#991b1b' : '#15803d',
                        border: `1px solid ${selectedWarranty.status === 'VOID' ? '#fca5a5' : '#86efac'}`,
                      }}
                    >
                      {selectedWarranty.status === 'VOID' ? 'VOID / CANCELLED' : 'VERIFIED & ACTIVE ✓'}
                    </span>
                  </div>
                </div>
              </div>

              {/* 2. TITLE RIBBON */}
              <div style={{ textAlign: 'center', marginBottom: '18px' }}>
                <h1
                  style={{
                    fontSize: '18px',
                    fontWeight: '900',
                    color: '#0f172a',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    margin: '0 0 3px 0',
                  }}
                >
                  Repair Warranty & Quality Assurance
                </h1>
                <p style={{ fontSize: '11px', color: '#64748b', margin: 0, fontStyle: 'italic' }}>
                  Official hardware warranty protection issued for authorized device repair and parts replacement
                </p>
              </div>

              {/* 3. CLIENT & DEVICE SPECIFICATION PANELS */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '14px',
                  marginBottom: '14px',
                }}
              >
                {/* Left: Customer Information */}
                <div
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    padding: '12px 14px',
                  }}
                >
                  <div style={{ fontSize: '10px', fontWeight: '800', color: '#1e3a8a', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <User size={12} /> Issued To (Customer Details)
                  </div>
                  <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
                    <tbody>
                      <tr>
                        <td style={{ color: '#64748b', paddingBottom: '4px', width: '35%' }}>Customer Name:</td>
                        <td style={{ fontWeight: '700', color: '#0f172a', paddingBottom: '4px' }}>{formatCustomer(selectedWarranty)}</td>
                      </tr>
                      <tr>
                        <td style={{ color: '#64748b', paddingBottom: '4px' }}>Phone Number:</td>
                        <td style={{ fontWeight: '700', color: '#0f172a', paddingBottom: '4px' }}>{selectedWarranty.customerMobile || 'N/A'}</td>
                      </tr>
                      <tr>
                        <td style={{ color: '#64748b', paddingBottom: '4px' }}>Job Card Ticket:</td>
                        <td style={{ fontWeight: '700', color: '#2563eb', paddingBottom: '4px' }}>#{selectedWarranty.repairNumber}</td>
                      </tr>
                      <tr>
                        <td style={{ color: '#64748b' }}>Tax Invoice:</td>
                        <td style={{ fontWeight: '700', color: '#0f172a' }}>{selectedWarranty.invoiceNumber && selectedWarranty.invoiceNumber !== 'N/A' ? selectedWarranty.invoiceNumber : 'RF-POS'}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Right: Device Specification */}
                <div
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    padding: '12px 14px',
                  }}
                >
                  <div style={{ fontSize: '10px', fontWeight: '800', color: '#1e3a8a', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Smartphone size={12} /> Covered Device Specification
                  </div>
                  <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
                    <tbody>
                      <tr>
                        <td style={{ color: '#64748b', paddingBottom: '4px', width: '35%' }}>Device Model:</td>
                        <td style={{ fontWeight: '700', color: '#0f172a', paddingBottom: '4px' }}>{formatDevice(selectedWarranty)}</td>
                      </tr>
                      <tr>
                        <td style={{ color: '#64748b', paddingBottom: '4px' }}>IMEI / Serial:</td>
                        <td style={{ fontWeight: '700', color: '#0f172a', paddingBottom: '4px' }}>{selectedWarranty.imei || 'N/A'}</td>
                      </tr>
                      <tr>
                        <td style={{ color: '#64748b', verticalAlign: 'top' }}>Service Details:</td>
                        <td style={{ fontWeight: '600', color: '#334155', fontSize: '11px', lineHeight: '1.3' }}>
                          {selectedWarranty.repairDetails || 'Hardware Component Inspection & Replacement Service'}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 4. FINANCIAL & PAYMENT CLEARANCE VERIFICATION */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr',
                  gap: '12px',
                  marginBottom: '14px',
                  padding: '12px 16px',
                  background: '#f0fdf4',
                  borderRadius: '6px',
                  border: '1px solid #86efac',
                }}
              >
                <div>
                  <span style={{ fontSize: '10px', color: '#166534', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.4px', display: 'block' }}>
                    Total Invoice Amount
                  </span>
                  <strong style={{ fontSize: '16px', color: '#14532d', display: 'block', marginTop: '2px', fontFamily: 'JetBrains Mono, monospace' }}>
                    {formatCurrency(selectedWarranty.totalAmount || 0)}
                  </strong>
                </div>

                <div>
                  <span style={{ fontSize: '10px', color: '#166534', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.4px', display: 'block' }}>
                    Total Paid Amount
                  </span>
                  <strong style={{ fontSize: '16px', color: '#15803d', display: 'block', marginTop: '2px', fontFamily: 'JetBrains Mono, monospace' }}>
                    {formatCurrency(selectedWarranty.paidAmount || 0)}
                  </strong>
                </div>

                <div>
                  <span style={{ fontSize: '10px', color: '#166534', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.4px', display: 'block' }}>
                    Payment Status
                  </span>
                  <strong style={{ fontSize: '13px', color: '#15803d', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                    <CheckCircle2 size={15} style={{ color: '#16a34a' }} /> PAID FULLY ✓
                  </strong>
                  <span style={{ fontSize: '10px', color: '#166534' }}>Settled in Full (Zero Due)</span>
                </div>
              </div>

              {/* 5. WARRANTY COVERAGE GUARANTEE BANNER */}
              <div
                style={{
                  marginBottom: '14px',
                  padding: '14px 18px',
                  background: 'linear-gradient(135deg, #eff6ff 0%, #f0fdf4 100%)',
                  borderRadius: '6px',
                  border: '1px solid #93c5fd',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff' }}>
                    <Award size={24} />
                  </div>
                  <div>
                    <span style={{ fontSize: '10px', color: '#1e40af', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Guaranteed Warranty Coverage
                    </span>
                    <strong style={{ display: 'block', fontSize: '18px', color: '#1e3a8a', letterSpacing: '0.3px' }}>
                      {selectedWarranty.serviceWarrantyDays} DAYS FULL WARRANTY
                    </strong>
                    <span style={{ fontSize: '11px', color: '#475569' }}>
                      Comprehensive Coverage on Labor & Replaced Hardware Components
                    </span>
                  </div>
                </div>

                <div style={{ textAlign: 'right', borderLeft: '1px dashed #93c5fd', paddingLeft: '16px' }}>
                  <div style={{ fontSize: '11px', color: '#475569', marginBottom: '2px' }}>
                    Effective: <strong style={{ color: '#0f172a' }}>{new Date(selectedWarranty.startDate).toLocaleDateString('en-GB')}</strong>
                  </div>
                  <div style={{ fontSize: '11px', color: '#475569' }}>
                    Valid Until: <strong style={{ color: '#b91c1c' }}>{new Date(selectedWarranty.expiryDate).toLocaleDateString('en-GB')}</strong>
                  </div>
                </div>
              </div>

              {/* 6. WARRANTY TERMS & CONDITIONS */}
              <div
                style={{
                  marginBottom: '16px',
                  background: '#f8fafc',
                  padding: '12px 14px',
                  borderRadius: '6px',
                  border: '1px solid #e2e8f0',
                }}
              >
                <div style={{ fontSize: '10px', fontWeight: '800', color: '#334155', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
                  Official Warranty Terms & Policy:
                </div>
                <ol
                  style={{
                    margin: 0,
                    paddingLeft: '18px',
                    fontSize: '10.5px',
                    color: '#475569',
                    lineHeight: '1.5',
                  }}
                >
                  <li>This warranty covers functional failure of replaced components and repair craftsmanship under ordinary usage conditions.</li>
                  <li><strong>Exclusions:</strong> Warranty does NOT cover physical drops, liquid or water ingression, screen cracks, electrical power surges, or unauthorized disassembly.</li>
                  <li>Device must be presented along with this certificate or Ticket #{selectedWarranty.repairNumber} for claim processing.</li>
                  <li>Internal workshop security seals and device serial numbers must remain untampered.</li>
                </ol>
              </div>

              {/* 7. AUTHENTICITY SEALS, BARCODE & AUTHORIZED SIGNATURE */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-end',
                  paddingTop: '12px',
                  borderTop: '1px solid #e2e8f0',
                }}
              >
                {/* Official Circular Seal Graphic */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div
                    style={{
                      width: '68px',
                      height: '68px',
                      borderRadius: '50%',
                      border: '2px dashed #1e3a8a',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '4px',
                      textAlign: 'center',
                      background: 'rgba(30, 58, 138, 0.04)',
                    }}
                  >
                    <BadgeCheck size={18} style={{ color: '#1e3a8a' }} />
                    <span style={{ fontSize: '7px', fontWeight: '900', color: '#1e3a8a', textTransform: 'uppercase', letterSpacing: '0.4px', marginTop: '2px' }}>
                      OFFICIAL SEAL
                    </span>
                    <span style={{ fontSize: '6px', color: '#64748b', textTransform: 'uppercase' }}>
                      QUALITY ASSURED
                    </span>
                  </div>
                  <div style={{ fontSize: '9px', color: '#64748b', maxWidth: '110px', lineHeight: '1.3' }}>
                    Authentic Verified Workshop Guarantee
                  </div>
                </div>

                {/* Ticket Barcode */}
                <div style={{ textAlign: 'center' }}>
                  <BarcodeGenerator
                    value={selectedWarranty.repairNumber}
                    width={1.2}
                    height={32}
                    displayValue={false}
                  />
                  <div style={{ fontSize: '9px', fontWeight: '700', color: '#475569', letterSpacing: '1px' }}>
                    {selectedWarranty.repairNumber}
                  </div>
                </div>

                {/* Workshop Authorized Signatory */}
                <div style={{ textAlign: 'center', minWidth: '180px' }}>
                  <div style={{ height: '32px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', marginBottom: '4px' }}>
                    <span style={{ fontFamily: 'Brush Script MT, cursive, italic', fontSize: '18px', color: '#1e3a8a', letterSpacing: '1px' }}>
                      {currentShop?.name ? `${currentShop.name.slice(0, 15)} Auth` : 'Certified Engineer'}
                    </span>
                  </div>
                  <div style={{ borderTop: '1px solid #334155', paddingTop: '4px' }}>
                    <div style={{ fontSize: '11px', fontWeight: '800', color: '#0f172a' }}>
                      Authorized Signatory & Stamp
                    </div>
                    <div style={{ fontSize: '9px', color: '#64748b' }}>
                      {currentShop?.name || 'Workshop Quality Control'}
                    </div>
                  </div>
                </div>
              </div>

              {/* 8. MICRO SECURITY IDENTIFIER */}
              <div
                style={{
                  marginTop: '12px',
                  paddingTop: '8px',
                  borderTop: '1px dashed #cbd5e1',
                  fontSize: '9px',
                  color: '#94a3b8',
                  display: 'flex',
                  justifyContent: 'space-between',
                }}
              >
                <span>Doc Ref: SEC-WCK-{(selectedWarranty._id || '').slice(-8).toUpperCase()}</span>
                <span>Generated by Zapate Service Manager • Valid without physical seal if digitally authenticated</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CREATE WARRANTY MODAL */}
      {isCreateModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <div className="card" style={{ maxWidth: '560px', width: '100%', padding: '24px', background: '#ffffff', borderRadius: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', paddingBottom: '12px', borderBottom: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Shield size={20} style={{ color: '#2563eb' }} />
                <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: 0 }}>Issue Repair Warranty</h3>
              </div>
              <button type="button" onClick={() => setIsCreateModalOpen(false)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleGenerateWarranty}>
              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label className="form-label">Select Completed Repair Job *</label>
                {completedRepairs.length === 0 ? (
                  <div style={{ fontSize: '12px', color: '#ea580c', padding: '10px', background: '#fff7ed', borderRadius: '6px', border: '1px solid #ffedd5' }}>
                    No completed repair jobs found. Complete a repair ticket first to issue a warranty.
                  </div>
                ) : (
                  <select className="input-control" value={selectedRepairId} onChange={(e) => setSelectedRepairId(e.target.value)} required>
                    {completedRepairs.map((r) => (
                      <option key={r._id} value={r._id}>
                        {r.number || r.jobNo || r.repairNumber || r._id} — {formatCustomer(r)} ({formatDevice(r)}) {r.dueAmount > 0 ? `[Locked 🔒 - Due: ₹${r.dueAmount}]` : '[Eligible ✓]'}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Payment Notice / Warning Banner */}
              {selectedRepairObject && (
                <div
                  style={{
                    marginBottom: '16px',
                    padding: '12px 14px',
                    borderRadius: '8px',
                    background: selectedRepairObject.dueAmount > 0 ? '#fff7ed' : '#f0fdf4',
                    border: `1px solid ${selectedRepairObject.dueAmount > 0 ? '#ffedd5' : '#bbf7d0'}`,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', fontWeight: '700', color: selectedRepairObject.dueAmount > 0 ? '#c2410c' : '#15803d' }}>
                      {selectedRepairObject.dueAmount > 0 ? '⚠️ Payment Incomplete' : '✓ Payment Fully Completed'}
                    </span>
                    <span style={{ fontSize: '11px', fontWeight: '800', color: selectedRepairObject.dueAmount > 0 ? '#ea580c' : '#166534' }}>
                      {selectedRepairObject.dueAmount > 0 ? `Outstanding: ${formatCurrency(selectedRepairObject.dueAmount)}` : 'Fully Paid'}
                    </span>
                  </div>
                  {selectedRepairObject.dueAmount > 0 && (
                    <p style={{ fontSize: '11px', color: '#9a3412', margin: 0 }}>
                      Warranty certificate will be available after full payment is completed.
                    </p>
                  )}
                </div>
              )}

              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label className="form-label">Warranty Coverage Duration</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                  {[
                    { label: 'No Warranty', val: '0' },
                    { label: '7 Days', val: '7' },
                    { label: '15 Days', val: '15' },
                    { label: '30 Days', val: '30' },
                    { label: '60 Days', val: '60' },
                    { label: '90 Days', val: '90' },
                    { label: 'Custom', val: 'custom' },
                  ].map((opt) => (
                    <button
                      key={opt.val}
                      type="button"
                      onClick={() => setWarrantyOption(opt.val)}
                      style={{
                        padding: '8px',
                        fontSize: '11px',
                        fontWeight: '700',
                        borderRadius: '6px',
                        border: warrantyOption === opt.val ? '1px solid #2563eb' : '1px solid #cbd5e1',
                        background: warrantyOption === opt.val ? '#eff6ff' : '#ffffff',
                        color: warrantyOption === opt.val ? '#1d4ed8' : '#334155',
                        cursor: 'pointer',
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {warrantyOption === 'custom' && (
                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label className="form-label">Enter Custom Days</label>
                  <input type="number" min="1" className="input-control" value={customDays} onChange={(e) => setCustomDays(e.target.value)} required />
                </div>
              )}

              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label className="form-label">Warranty Terms & Conditions Note</label>
                <textarea className="textarea-control" rows={2} value={warrantyTerms} onChange={(e) => setWarrantyTerms(e.target.value)} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsCreateModalOpen(false)}>Cancel</button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isCreating || completedRepairs.length === 0 || (selectedRepairObject && selectedRepairObject.dueAmount > 0)}
                >
                  {isCreating ? 'Generating...' : 'Confirm & Issue Warranty'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VOID WARRANTY MODAL */}
      {voidModalItem && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <div className="card" style={{ maxWidth: '440px', width: '100%', padding: '24px', background: '#ffffff', borderRadius: '12px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#ef4444', marginBottom: '8px' }}>
              Void Warranty Certificate #{voidModalItem.repairNumber}
            </h3>
            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>
              Are you sure you want to invalidate this warranty for <strong>{formatCustomer(voidModalItem)}</strong>?
            </p>

            <form onSubmit={handleConfirmVoid}>
              <div className="form-group" style={{ marginBottom: '18px' }}>
                <label className="form-label">Reason for Voiding Warranty *</label>
                <textarea className="textarea-control" rows={2} placeholder="e.g. Liquid damage / Opened by unauthorized technician" value={voidReason} onChange={(e) => setVoidReason(e.target.value)} required />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setVoidModalItem(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ background: '#ef4444', borderColor: '#ef4444' }} disabled={isVoiding}>
                  {isVoiding ? 'Voiding...' : 'Confirm Void'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </MainLayout>
  );
};
