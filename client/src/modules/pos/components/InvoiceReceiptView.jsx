import React, { useRef, useState, useEffect } from 'react';
import { formatCurrency, formatDate } from '../../../utils/formatters.js';
import { BarcodeGenerator } from '../../../components/common/BarcodeGenerator.jsx';
import {
  Printer,
  Download,
  Share2,
  CheckCircle,
  Clock,
  AlertCircle,
  Wrench,
  Smartphone,
  Copy,
  Check,
  X,
  Phone,
  Mail,
  MapPin,
  FileText,
  DollarSign,
  Receipt,
} from 'lucide-react';
import { toast } from 'sonner';
import html2pdf from 'html2pdf.js';

import { useAuth } from '../../../context/AuthContext.jsx';
import { ReceivePaymentModal } from '../../payments/components/ReceivePaymentModal.jsx';
import { PaymentReceiptModal } from '../../payments/components/PaymentReceiptModal.jsx';
import api from '../../../services/api.js';

export const InvoiceReceiptView = ({ invoice: initialInvoice, onClose, standalone = false }) => {
  const { currentShop, user } = useAuth();
  const receiptRef = useRef(null);
  const [invoice, setInvoice] = useState(initialInvoice);
  const [payments, setPayments] = useState(initialInvoice?.payments || []);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [copied, setCopied] = useState(false);

  const [isReceivePaymentOpen, setIsReceivePaymentOpen] = useState(false);
  const [viewPaymentReceipt, setViewPaymentReceipt] = useState(null);

  useEffect(() => {
    setInvoice(initialInvoice);
    if (initialInvoice?._id) {
      api.get(`/payments/invoice/${initialInvoice._id}`)
        .then((res) => {
          if (Array.isArray(res)) setPayments(res);
        })
        .catch(() => {
          if (initialInvoice.payments) setPayments(initialInvoice.payments);
        });
    }
  }, [initialInvoice]);

  if (!invoice) return null;

  // Resolve shop branding dynamically from shopSnapshot, populated shopId, or current logged-in shop
  const shop = invoice.shopSnapshot || (typeof invoice.shopId === 'object' ? invoice.shopId : {}) || currentShop || {};
  const shopName = shop.name || currentShop?.name || user?.shopName || 'Workshop Receipt';
  const shopLogo = shop.logo || currentShop?.logo || '';
  const businessType = shop.businessType || currentShop?.businessType || 'Mobile Repair Workshop';
  const shopPhone = shop.shopContactNumber || shop.ownerMobile || shop.phone || currentShop?.phone || currentShop?.ownerMobile || '';
  const shopEmail = shop.businessEmail || shop.ownerEmail || shop.email || currentShop?.email || '';
  const shopAddress = shop.address || currentShop?.address || [shop.addressLine1, shop.city, shop.state].filter(Boolean).join(', ') || '';
  const shopGst = shop.gstNumber || shop.gstin || currentShop?.gstNumber || '';
  const termsText =
    shop.termsAndConditions ||
    shop.warrantyTerms ||
    currentShop?.termsAndConditions ||
    '1. Device must be collected within 10 days.\n2. Physical damage and water damage are not covered under warranty.\n3. Warranty is not applicable if another technician opens or repairs the device.\n4. Data loss is not the responsibility of the workshop.';

  const termsList = String(termsText)
    .split('\n')
    .map((t) => t.trim())
    .filter(Boolean);

  // Parse invoice date & time
  const createdDate = invoice.createdAt ? new Date(invoice.createdAt) : new Date();
  const formattedDate = createdDate.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const formattedTime = createdDate.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const invoiceNumber = invoice.number || `INV-${Date.now().toString().slice(-6)}`;
  const orderId = invoice.orderId || `ORD${(invoice.number || '').replace(/[^0-9]/g, '') || Date.now().toString().slice(-6)}`;

  // Total calculations
  const totalAmount = Number(invoice.total) || 0;
  const calculatedPaid = payments.length > 0
    ? payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
    : Number(invoice.paidAmount !== undefined ? invoice.paidAmount : totalAmount);
  const paidAmount = calculatedPaid;
  const dueAmount = Math.max(0, totalAmount - paidAmount);

  // Dynamic Status Badge calculation
  let statusStr = (invoice.status || 'PAID').toUpperCase();
  if (statusStr !== 'CANCELLED') {
    if (dueAmount <= 0) statusStr = 'PAID';
    else if (paidAmount > 0) statusStr = 'PARTIALLY PAID';
    else statusStr = 'UNPAID';
  }

  const isPaid = statusStr === 'PAID';
  const isPending = statusStr === 'PARTIALLY PAID' || statusStr === 'PENDING' || statusStr === 'PARTIAL';
  const isUnpaid = statusStr === 'UNPAID';
  const isCancelled = statusStr === 'CANCELLED';

  // Custom Fields with values
  const validCustomFields = (invoice.customFields || []).filter(
    (cf) => cf && cf.name && String(cf.name).trim() && cf.value && String(cf.value).trim()
  );

  // Item rows
  const items = (invoice.items && invoice.items.length > 0)
    ? invoice.items
    : [
        {
          name: 'Device Repair Service',
          model: invoice.deviceModel || 'Universal',
          problem: invoice.reportedProblem || 'Hardware inspection & repair',
          price: totalAmount,
          quantity: 1,
          total: totalAmount,
        },
      ];

  // Print Handler
  const handlePrint = () => {
    window.print();
  };

  // Download PDF Handler
  const handleDownloadPdf = async () => {
    if (!receiptRef.current) return;
    setIsGeneratingPdf(true);
    toast.loading('Generating invoice PDF...', { id: 'pdf-toast' });

    try {
      const element = receiptRef.current;
      const opt = {
        margin: [8, 8, 8, 8],
        filename: `Receipt-${invoiceNumber}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      };

      await html2pdf().set(opt).from(element).save();
      toast.success(`Invoice ${invoiceNumber} downloaded!`, { id: 'pdf-toast' });
    } catch (err) {
      console.error('[InvoiceReceiptView] PDF error:', err);
      toast.error('Failed to download PDF. Try printing to PDF.', { id: 'pdf-toast' });
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Share Handler
  const handleShare = async () => {
    const shareText = `🧾 *Invoice from ${shopName}*\n\n*Invoice No:* ${invoiceNumber}\n*Order ID:* ${orderId}\n*Customer:* ${invoice.customerName || 'Walk-in Client'}\n*Total Amount:* ₹${totalAmount.toLocaleString()}\n*Paid:* ₹${paidAmount.toLocaleString()}\n*Amount Due:* ₹${dueAmount.toLocaleString()}\n*Status:* ${statusStr}\n\nThank you for choosing ${shopName}!`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Invoice ${invoiceNumber} - ${shopName}`,
          text: shareText,
          url: window.location.href,
        });
        toast.success('Invoice shared successfully!');
        return;
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.warn('Web Share failed, using WhatsApp fallback:', err);
        }
      }
    }

    // Fallback: WhatsApp share link
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
    window.open(waUrl, '_blank');
    toast.success('Opening WhatsApp to share receipt...');
  };

  // Copy details
  const handleCopyDetails = () => {
    const summary = `Invoice: ${invoiceNumber} | Order: ${orderId} | Shop: ${shopName} | Total: ₹${totalAmount} | Status: ${statusStr}`;
    navigator.clipboard.writeText(summary);
    setCopied(true);
    toast.success('Invoice summary copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePaymentReceivedSuccess = ({ payment: newPayment, invoice: updatedInvoice }) => {
    if (updatedInvoice) setInvoice(updatedInvoice);
    if (newPayment) setPayments((prev) => [...prev, newPayment]);
    if (newPayment) setViewPaymentReceipt({ payment: newPayment, invoice: updatedInvoice || invoice });
  };

  return (
    <div className={`receipt-modal-wrapper ${standalone ? 'standalone' : ''}`}>
      {/* Top Action Bar (hidden in print) */}
      <div className="receipt-action-bar no-print">
        <div className="receipt-action-left">
          <span className="badge-receipt-tag">
            <FileText size={13} /> TAX INVOICE & RECEIPT
          </span>
          <span className="receipt-number-tag">{invoiceNumber}</span>
        </div>

        <div className="receipt-action-buttons">
          {dueAmount > 0 && !isCancelled && (
            <button
              type="button"
              className="btn btn-primary btn-sm"
              style={{ background: '#059669', borderColor: '#059669' }}
              onClick={() => setIsReceivePaymentOpen(true)}
              title="Receive Payment for Outstanding Due"
            >
              <DollarSign size={14} /> Receive Payment
            </button>
          )}
          <button type="button" className="btn btn-secondary btn-sm" onClick={handleCopyDetails} title="Copy Invoice Summary">
            {copied ? <Check size={14} color="#059669" /> : <Copy size={14} />} {copied ? 'Copied' : 'Copy'}
          </button>
          <button type="button" className="btn btn-secondary btn-sm" onClick={handleShare} title="Share via WhatsApp / Apps">
            <Share2 size={14} /> Share
          </button>
          <button type="button" className="btn btn-secondary btn-sm" onClick={handleDownloadPdf} disabled={isGeneratingPdf} title="Download PDF Receipt">
            <Download size={14} /> {isGeneratingPdf ? 'Exporting...' : 'PDF'}
          </button>
          <button type="button" className="btn btn-primary btn-sm" onClick={handlePrint} title="Print Receipt">
            <Printer size={14} /> Print
          </button>
          {onClose && (
            <button type="button" className="btn btn-secondary btn-sm receipt-close-btn" onClick={onClose} title="Close">
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Main Printable Receipt Card */}
      <div className="receipt-card-container">
        <div ref={receiptRef} className="receipt-paper" id="printable-receipt">
          {/* ==================================================== */}
          {/* 1. SHOP INFORMATION & LOGO AT THE TOP                */}
          {/* ==================================================== */}
          <div className="receipt-header-section">
            {shopLogo ? (
              <div className="receipt-logo-box">
                <img src={shopLogo} alt={shopName} className="receipt-logo-img" />
              </div>
            ) : (
              <div className="receipt-logo-placeholder">
                <Wrench size={26} color="#2563eb" />
              </div>
            )}

            <h1 className="receipt-shop-name">{shopName}</h1>
            <p className="receipt-shop-tagline">{businessType}</p>

            <div className="receipt-shop-contact-meta">
              {shopAddress && (
                <div className="receipt-meta-line">
                  <MapPin size={11} className="meta-icon" />
                  <span>{shopAddress}</span>
                </div>
              )}
              {shopPhone && (
                <div className="receipt-meta-line">
                  <Phone size={11} className="meta-icon" />
                  <span>Phone: <strong>{shopPhone}</strong></span>
                </div>
              )}
              {shopEmail && (
                <div className="receipt-meta-line">
                  <Mail size={11} className="meta-icon" />
                  <span>Email: {shopEmail}</span>
                </div>
              )}
              {shopGst && (
                <div className="receipt-meta-line receipt-gstin-line">
                  <span>GSTIN: <strong>{shopGst}</strong></span>
                </div>
              )}
            </div>
          </div>

          <div className="receipt-dashed-divider" />

          {/* ==================================================== */}
          {/* 3. INVOICE INFORMATION & DYNAMIC BARCODE             */}
          {/* ==================================================== */}
          <div className="receipt-invoice-meta-grid">
            <div className="meta-col">
              <div className="meta-label">INVOICE NO</div>
              <div className="meta-value bold-mono">{invoiceNumber}</div>
            </div>
            <div className="meta-col">
              <div className="meta-label">ORDER ID</div>
              <div className="meta-value bold-mono">{orderId}</div>
            </div>
            <div className="meta-col">
              <div className="meta-label">DATE</div>
              <div className="meta-value">{formattedDate}</div>
            </div>
            <div className="meta-col">
              <div className="meta-label">TIME</div>
              <div className="meta-value">{formattedTime}</div>
            </div>
          </div>

          {/* Barcode encoding Invoice Number / Order ID */}
          <div className="receipt-barcode-wrapper">
            <BarcodeGenerator value={invoiceNumber || orderId} width={1.4} height={36} fontSize={10} />
          </div>

          <div className="receipt-dashed-divider" />

          {/* ==================================================== */}
          {/* 4. CUSTOMER INFORMATION                              */}
          {/* ==================================================== */}
          <div className="receipt-customer-section">
            <div className="receipt-section-heading">CUSTOMER DETAILS</div>
            <div className="receipt-customer-details">
              <div className="customer-row">
                <span className="c-label">Customer Name:</span>
                <span className="c-val"><strong>{invoice.customerName || 'Walk-in Client'}</strong></span>
              </div>
              {invoice.customerMobile && (
                <div className="customer-row">
                  <span className="c-label">Phone:</span>
                  <span className="c-val">{invoice.customerMobile}</span>
                </div>
              )}
              {invoice.customerEmail && (
                <div className="customer-row">
                  <span className="c-label">Email:</span>
                  <span className="c-val">{invoice.customerEmail}</span>
                </div>
              )}
              {invoice.customerAddress && (
                <div className="customer-row">
                  <span className="c-label">Address:</span>
                  <span className="c-val">{invoice.customerAddress}</span>
                </div>
              )}
            </div>
          </div>

          {/* Device Summary banner if present */}
          {(invoice.deviceBrand || invoice.deviceModel || invoice.deviceImei) && (
            <div className="receipt-device-banner">
              <div className="device-icon-box">
                <Smartphone size={14} />
              </div>
              <div className="device-details-text">
                <strong>Device:</strong> {[invoice.deviceBrand, invoice.deviceModel].filter(Boolean).join(' ') || 'Mobile Device'}
                {invoice.deviceImei && <span className="device-imei-text"> (IMEI: {invoice.deviceImei})</span>}
              </div>
            </div>
          )}

          <div className="receipt-dashed-divider" />

          {/* ==================================================== */}
          {/* 5. DEVICE AND REPAIR DETAILS TABLE                   */}
          {/* ==================================================== */}
          <div className="receipt-table-section">
            <table className="receipt-items-table">
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', width: '32%' }}>MODEL</th>
                  <th style={{ textAlign: 'left', width: '48%' }}>PROBLEM / ITEM</th>
                  <th style={{ textAlign: 'right', width: '20%' }}>PRICE</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => {
                  const modelDisplay = item.model || invoice.deviceModel || invoice.deviceBrand || 'Universal';
                  const problemDisplay = item.problem || item.name || invoice.reportedProblem || 'Repair Component';
                  const itemPrice = item.total !== undefined ? item.total : (item.price || 0) * (item.quantity || 1);

                  return (
                    <tr key={index}>
                      <td className="item-model-cell">
                        <strong>{modelDisplay}</strong>
                      </td>
                      <td className="item-problem-cell">
                        <span>{problemDisplay}</span>
                        {item.quantity > 1 && <span className="item-qty-tag"> (Qty: {item.quantity})</span>}
                      </td>
                      <td className="item-price-cell">
                        {formatCurrency(itemPrice)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* ==================================================== */}
          {/* 7. CUSTOMER REPORTED PROBLEM (if separate)           */}
          {/* ==================================================== */}
          {invoice.reportedProblem && (
            <div className="receipt-problem-box">
              <div className="box-label">Customer Reported Problem:</div>
              <div className="box-content">{invoice.reportedProblem}</div>
            </div>
          )}

          {/* ==================================================== */}
          {/* 9. CUSTOM FIELDS SYSTEM                              */}
          {/* ==================================================== */}
          {validCustomFields.length > 0 && (
            <div className="receipt-custom-fields-box">
              <div className="box-label">Additional Specifications:</div>
              <div className="custom-fields-list">
                {validCustomFields.map((cf, i) => (
                  <div key={i} className="custom-field-row">
                    <span className="cf-name">{cf.name}:</span>
                    <span className="cf-value">{cf.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* 8. ADDITIONAL NOTES                                  */}
          {/* ==================================================== */}
          {invoice.notes && invoice.notes.trim() && (
            <div className="receipt-notes-box">
              <div className="box-label">Technician & Workshop Notes:</div>
              <div className="box-content">{invoice.notes}</div>
            </div>
          )}

          <div className="receipt-dashed-divider" />

          {/* ==================================================== */}
          {/* 10. PAYMENT SUMMARY & STATUS                         */}
          {/* ==================================================== */}
          <div className="receipt-payment-section">
            <div className="payment-line">
              <span>Subtotal</span>
              <span>{formatCurrency(invoice.subtotal || totalAmount)}</span>
            </div>

            {Number(invoice.taxAmount) > 0 && (
              <div className="payment-line">
                <span>GST ({invoice.taxPercent || 18}%)</span>
                <span>{formatCurrency(invoice.taxAmount)}</span>
              </div>
            )}

            {Number(invoice.discountAmount) > 0 && (
              <div className="payment-line discount-line">
                <span>Discount</span>
                <span>-{formatCurrency(invoice.discountAmount)}</span>
              </div>
            )}

            <div className="receipt-solid-divider" />

            <div className="payment-line total-amount-line">
              <span>TOTAL AMOUNT</span>
              <span className="highlight-price">{formatCurrency(totalAmount)}</span>
            </div>

            <div className="payment-line paid-amount-line">
              <span>TOTAL PAID</span>
              <span>{formatCurrency(paidAmount)}</span>
            </div>

            <div className="receipt-solid-divider" />

            <div className="payment-line due-amount-line">
              <span>REMAINING DUE</span>
              <span className={dueAmount > 0 ? 'due-alert-price' : 'due-zero-price'}>
                {formatCurrency(dueAmount)}
              </span>
            </div>

            {/* Payment Status & Method Badges */}
            <div className="receipt-status-badge-wrapper">
              <div className={`receipt-payment-status ${isPaid ? 'status-paid' : isPending ? 'status-pending' : isCancelled ? 'status-unpaid' : 'status-unpaid'}`}>
                {isPaid && <CheckCircle size={14} />}
                {isPending && <Clock size={14} />}
                {isUnpaid && <AlertCircle size={14} />}
                <span>{statusStr}</span>
              </div>

              {invoice.paymentMethod && (
                <div className="receipt-payment-method-tag">
                  Latest Method: <strong>{invoice.paymentMethod}</strong>
                </div>
              )}
            </div>
          </div>

          {/* ==================================================== */}
          {/* 11. PAYMENT HISTORY (TRANSACTION AUDIT TRAIL)        */}
          {/* ==================================================== */}
          <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '2px dashed #cbd5e1' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <strong style={{ fontSize: '12px', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                PAYMENT HISTORY ({payments.length})
              </strong>
              {dueAmount > 0 && !isCancelled && (
                <button
                  type="button"
                  className="btn btn-secondary btn-sm no-print"
                  style={{ fontSize: '11px', color: '#059669', borderColor: '#a7f3d0', padding: '2px 8px' }}
                  onClick={() => setIsReceivePaymentOpen(true)}
                >
                  <DollarSign size={12} /> Receive Due
                </button>
              )}
            </div>

            {payments.length === 0 ? (
              <div style={{ fontSize: '12px', color: '#94a3b8', fontStyle: 'italic', padding: '8px 0' }}>
                {paidAmount > 0 ? `Initial settlement: ₹${paidAmount.toLocaleString()} (${invoice.paymentMethod || 'UPI'})` : 'No payments received yet.'}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {payments.map((p, idx) => {
                  const pDate = p.paymentDate ? new Date(p.paymentDate) : new Date(p.createdAt || Date.now());
                  const dateStr = pDate.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });

                  return (
                    <div
                      key={p._id || idx}
                      style={{
                        display: 'flex',
                        justify: 'space-between',
                        alignItems: 'center',
                        padding: '8px 12px',
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '6px',
                        fontSize: '12px',
                      }}
                    >
                      <div>
                        <strong style={{ color: '#2563eb', fontFamily: 'JetBrains Mono' }}>
                          {p.paymentReceiptNumber || `PAY-${idx + 1}`}
                        </strong>
                        <span style={{ color: '#64748b', marginLeft: '8px' }}>{dateStr}</span>
                        {p.notes && <div style={{ fontSize: '10px', color: '#94a3b8' }}>{p.notes}</div>}
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <strong style={{ color: '#059669', fontSize: '13px' }}>
                          +{formatCurrency(p.amount)}
                        </strong>
                        <span style={{ fontSize: '10px', color: '#64748b', display: 'block' }}>
                          {p.paymentMethod || 'Cash'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="receipt-dashed-divider" />

          {/* ==================================================== */}
          {/* 13. TERMS AND CONDITIONS & FOOTER                    */}
          {/* ==================================================== */}
          <div className="receipt-footer-section">
            <div className="receipt-thank-you">❤️ Thank You!</div>
            <div className="receipt-terms-heading">Terms & Conditions:</div>
            <ol className="receipt-terms-list">
              {termsList.map((term, index) => (
                <li key={index}>{term.replace(/^[0-9]+\.\s*/, '')}</li>
              ))}
            </ol>
            <div className="receipt-system-tag">
              Powered by ZSM • Workshop Operating System
            </div>
          </div>
        </div>
      </div>

      {/* Receive Payment Modal */}
      {isReceivePaymentOpen && (
        <ReceivePaymentModal
          invoice={invoice}
          onClose={() => setIsReceivePaymentOpen(false)}
          onSuccess={handlePaymentReceivedSuccess}
        />
      )}

      {/* View Individual Payment Receipt Modal */}
      {viewPaymentReceipt && (
        <PaymentReceiptModal
          paymentData={viewPaymentReceipt}
          onClose={() => setViewPaymentReceipt(null)}
        />
      )}
    </div>
  );
};

