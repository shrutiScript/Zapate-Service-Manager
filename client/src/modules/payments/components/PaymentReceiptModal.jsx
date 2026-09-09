import React, { useRef, useState } from 'react';
import { formatCurrency, formatDate } from '../../../utils/formatters.js';
import { BarcodeGenerator } from '../../../components/common/BarcodeGenerator.jsx';
import { Printer, Download, Share2, CheckCircle, Clock, AlertCircle, Wrench, Smartphone, Copy, Check, X, Phone, Mail, MapPin, FileText, Receipt } from 'lucide-react';
import { toast } from 'sonner';
import html2pdf from 'html2pdf.js';
import { useAuth } from '../../../context/AuthContext.jsx';

export const PaymentReceiptModal = ({ paymentData, onClose }) => {
  const { currentShop, user } = useAuth();
  const receiptRef = useRef(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!paymentData) return null;

  const payment = paymentData.payment || paymentData;
  const invoice = paymentData.invoice || payment.invoiceId || {};

  const shop = currentShop || {};
  const shopName = shop.name || user?.shopName || 'Zapate Service Manager Workshop';
  const shopLogo = shop.logo || '';
  const shopPhone = shop.phone || shop.ownerMobile || '';
  const shopEmail = shop.email || shop.businessEmail || '';
  const shopAddress = shop.address || [shop.addressLine1, shop.city, shop.state].filter(Boolean).join(', ') || '';
  const shopGst = shop.gstNumber || shop.gstin || '';

  const receiptNumber = payment.paymentReceiptNumber || payment.transactionNumber || `PAY-${Date.now().toString().slice(-6)}`;
  const invoiceNumber = payment.invoiceNumber || invoice.number || 'N/A';
  const customerName = payment.customerName || invoice.customerName || 'Walk-in Client';
  const customerMobile = payment.customerMobile || invoice.customerMobile || '';
  
  const paymentDate = payment.paymentDate ? new Date(payment.paymentDate) : (payment.createdAt ? new Date(payment.createdAt) : new Date());
  const formattedDate = paymentDate.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const formattedTime = paymentDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

  const amountReceived = Number(payment.amount) || 0;
  const previousDue = Number(payment.previousDue !== undefined ? payment.previousDue : (Number(invoice.total || 0) - (Number(invoice.paidAmount || 0) - amountReceived)));
  const remainingDue = Number(payment.remainingDue !== undefined ? payment.remainingDue : Math.max(0, previousDue - amountReceived));

  const statusStr = (invoice.status || (remainingDue === 0 ? 'PAID' : 'PARTIALLY PAID')).toUpperCase();

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    if (!receiptRef.current) return;
    setIsGeneratingPdf(true);
    toast.loading('Generating payment receipt PDF...', { id: 'pdf-receipt-toast' });

    try {
      const element = receiptRef.current;
      const opt = {
        margin: [8, 8, 8, 8],
        filename: `PaymentReceipt-${receiptNumber}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      };

      await html2pdf().set(opt).from(element).save();
      toast.success(`Payment Receipt ${receiptNumber} downloaded!`, { id: 'pdf-receipt-toast' });
    } catch (err) {
      console.error('[PaymentReceiptModal] PDF error:', err);
      toast.error('Failed to download PDF receipt.', { id: 'pdf-receipt-toast' });
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleShare = async () => {
    const shareText = `🧾 *PAYMENT RECEIPT*\nReceipt No: ${receiptNumber}\nInvoice No: ${invoiceNumber}\nCustomer: ${customerName}\nAmount Received: ₹${amountReceived.toLocaleString()}\nMethod: ${payment.paymentMethod || 'Cash'}\nRemaining Due: ₹${remainingDue.toLocaleString()}\nStatus: ${statusStr}\n\nThank you for choosing ${shopName}!`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Payment Receipt ${receiptNumber} - ${shopName}`,
          text: shareText,
          url: window.location.href,
        });
        toast.success('Payment receipt shared!');
        return;
      } catch (err) {
        if (err.name !== 'AbortError') console.warn('Share error:', err);
      }
    }

    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
    window.open(waUrl, '_blank');
    toast.success('Opening WhatsApp to share receipt...');
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1100,
        padding: '16px',
      }}
    >
      <div
        className="card"
        style={{
          maxWidth: '560px',
          width: '100%',
          padding: '0',
          background: '#ffffff',
          borderRadius: '14px',
          overflow: 'hidden',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Action Header */}
        <div
          className="no-print"
          style={{
            padding: '14px 20px',
            background: '#0f172a',
            color: '#ffffff',
            display: 'flex',
            justify: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Receipt size={18} style={{ color: '#38bdf8' }} />
            <span style={{ fontSize: '14px', fontWeight: '800', fontFamily: 'JetBrains Mono' }}>
              {receiptNumber}
            </span>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="button" className="btn btn-secondary btn-sm" onClick={handleShare} title="Share Receipt">
              <Share2 size={14} /> Share
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
            >
              <Download size={14} /> {isGeneratingPdf ? 'Exporting...' : 'PDF'}
            </button>
            <button type="button" className="btn btn-primary btn-sm" onClick={handlePrint}>
              <Printer size={14} /> Print
            </button>
            {onClose && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={onClose}
                style={{ marginLeft: '4px' }}
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Printable Payment Receipt Container */}
        <div style={{ overflowY: 'auto', padding: '24px' }}>
          <div ref={receiptRef} className="receipt-paper" id="printable-payment-receipt">
            {/* Header Section */}
            <div className="receipt-header-section" style={{ textAlign: 'center' }}>
              {shopLogo ? (
                <img src={shopLogo} alt={shopName} style={{ height: '48px', marginBottom: '8px', objectFit: 'contain' }} />
              ) : (
                <div style={{ display: 'inline-flex', padding: '10px', background: '#eff6ff', borderRadius: '12px', color: '#2563eb', marginBottom: '8px' }}>
                  <Wrench size={24} />
                </div>
              )}
              <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: 0 }}>{shopName}</h2>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                {shopAddress} {shopPhone ? `• Ph: ${shopPhone}` : ''}
              </div>
              {shopGst && <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>GSTIN: {shopGst}</div>}
            </div>

            <div className="receipt-dashed-divider" style={{ margin: '16px 0' }} />

            {/* Title Banner */}
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <div style={{ fontSize: '13px', fontWeight: '800', letterSpacing: '1px', color: '#2563eb', textTransform: 'uppercase' }}>
                OFFICIAL PAYMENT RECEIPT
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                Acknowledgement of Settlement Received
              </div>
            </div>

            {/* Receipt & Invoice Meta Table */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
                padding: '12px 14px',
                background: '#f8fafc',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                marginBottom: '16px',
                fontSize: '12px',
              }}
            >
              <div>
                <span style={{ color: '#64748b', fontSize: '10px', textTransform: 'uppercase', fontWeight: '700' }}>Receipt No:</span>
                <strong style={{ display: 'block', color: '#0f172a', fontFamily: 'JetBrains Mono' }}>{receiptNumber}</strong>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: '10px', textTransform: 'uppercase', fontWeight: '700' }}>Invoice No:</span>
                <strong style={{ display: 'block', color: '#2563eb', fontFamily: 'JetBrains Mono' }}>{invoiceNumber}</strong>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: '10px', textTransform: 'uppercase', fontWeight: '700' }}>Payment Date:</span>
                <span style={{ display: 'block', color: '#0f172a' }}>{formattedDate} {formattedTime}</span>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: '10px', textTransform: 'uppercase', fontWeight: '700' }}>Payment Mode:</span>
                <strong style={{ display: 'block', color: '#0f172a' }}>{payment.paymentMethod || 'Cash'}</strong>
              </div>
            </div>

            {/* Customer Details */}
            <div style={{ marginBottom: '16px', padding: '0 4px', fontSize: '13px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ color: '#64748b' }}>Received From:</span>
                <strong style={{ color: '#0f172a' }}>{customerName}</strong>
              </div>
              {customerMobile && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ color: '#64748b' }}>Contact Phone:</span>
                  <span style={{ color: '#0f172a' }}>{customerMobile}</span>
                </div>
              )}
            </div>

            <div className="receipt-solid-divider" style={{ margin: '14px 0' }} />

            {/* Settlement Financial Breakdown */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Previous Due Amount:</span>
                <span>{formatCurrency(previousDue)}</span>
              </div>
              
              <div
                style={{
                  display: 'flex',
                  justify: 'space-between',
                  padding: '10px 12px',
                  background: '#ecfdf5',
                  border: '1px solid #a7f3d0',
                  borderRadius: '6px',
                  color: '#047857',
                  fontWeight: '800',
                  fontSize: '15px',
                }}
              >
                <span>AMOUNT RECEIVED:</span>
                <span>{formatCurrency(amountReceived)}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '4px' }}>
                <span style={{ color: '#64748b', fontWeight: '700' }}>REMAINING DUE:</span>
                <strong style={{ color: remainingDue > 0 ? '#dc2626' : '#059669', fontSize: '14px' }}>
                  {formatCurrency(remainingDue)}
                </strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px', paddingTop: '8px', borderTop: '1px dashed #cbd5e1' }}>
                <span style={{ fontSize: '12px', color: '#64748b' }}>Updated Invoice Status:</span>
                <span
                  style={{
                    padding: '3px 10px',
                    borderRadius: '12px',
                    fontSize: '11px',
                    fontWeight: '800',
                    background: statusStr === 'PAID' ? '#dcfce7' : '#fef3c7',
                    color: statusStr === 'PAID' ? '#15803d' : '#b45309',
                  }}
                >
                  {statusStr}
                </span>
              </div>
            </div>

            {payment.notes && (
              <div style={{ marginTop: '14px', padding: '10px', background: '#f8fafc', borderRadius: '6px', fontSize: '12px', color: '#475569', border: '1px solid #e2e8f0' }}>
                <strong>Notes / Reference:</strong> {payment.notes}
              </div>
            )}

            <div className="receipt-dashed-divider" style={{ margin: '20px 0 16px' }} />

            {/* Signatures & Footer */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', paddingTop: '12px', fontSize: '11px', color: '#64748b' }}>
              <div>
                <div>Received By: <strong>{payment.receivedBy || 'Staff'}</strong></div>
                <div style={{ marginTop: '4px' }}>Thank you for your business!</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ height: '32px', borderBottom: '1px solid #94a3b8', width: '120px', marginBottom: '4px' }}></div>
                <div>Authorized Signature</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
