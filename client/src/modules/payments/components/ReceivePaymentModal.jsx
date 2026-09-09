import React, { useState, useEffect } from 'react';
import { formatCurrency, formatDate } from '../../../utils/formatters.js';
import { DollarSign, X, Check, AlertCircle, ArrowRight, ShieldCheck, Calendar, CreditCard, FileText } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../../services/api.js';

export const ReceivePaymentModal = ({ invoice, onClose, onSuccess }) => {
  if (!invoice) return null;

  const invoiceNumber = invoice.number || invoice.invoiceNumber || 'INV-000000';
  const customerName = invoice.customerName || 'Walk-in Client';
  const customerMobile = invoice.customerMobile || 'N/A';
  
  const totalAmount = Number(invoice.total) || 0;
  const totalPaid = Number(invoice.paidAmount !== undefined ? invoice.paidAmount : (totalAmount - (invoice.dueAmount || 0)));
  const currentDue = Math.max(0, Number(invoice.dueAmount !== undefined ? invoice.dueAmount : totalAmount - totalPaid));

  const [amount, setAmount] = useState(String(currentDue));
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    setAmount(String(currentDue));
    setValidationError('');
  }, [invoice?._id, currentDue]);

  const handleAmountChange = (val) => {
    setAmount(val);
    setValidationError('');
    const num = Number(val);
    if (isNaN(num) || num <= 0) {
      setValidationError('Payment amount must be greater than ₹0.');
    } else if (num > currentDue + 0.01) {
      setValidationError(`Payment amount cannot exceed the remaining due amount of ₹${currentDue.toLocaleString()}.`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError('');

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      const err = 'Please enter a valid payment amount greater than ₹0.';
      setValidationError(err);
      toast.error(err);
      return;
    }

    if (numAmount > currentDue + 0.01) {
      const err = `Payment amount (₹${numAmount.toLocaleString()}) cannot exceed remaining due amount (₹${currentDue.toLocaleString()}).`;
      setValidationError(err);
      toast.error(err);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.post('/payments/receive', {
        invoiceId: invoice._id || invoice.id,
        amount: numAmount,
        paymentMethod,
        paymentDate,
        notes: notes.trim(),
      });

      const payload = res.data || res;
      toast.success(`Payment of ₹${numAmount.toLocaleString()} received successfully for ${invoiceNumber}!`);

      if (onSuccess) {
        onSuccess(payload);
      }
      onClose();
    } catch (err) {
      const errMsg = err.message || 'Failed to record payment';
      setValidationError(errMsg);
      toast.error(errMsg);
    } finally {
      setIsSubmitting(false);
    }
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
        zIndex: 1000,
        padding: '16px',
      }}
    >
      <div
        className="card"
        style={{
          maxWidth: '520px',
          width: '100%',
          padding: '0',
          background: '#ffffff',
          borderRadius: '14px',
          overflow: 'hidden',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            color: '#ffffff',
            display: 'flex',
            justify: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'rgba(37, 99, 235, 0.2)',
                color: '#60a5fa',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <DollarSign size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#ffffff', margin: 0 }}>
                Receive Due Payment
              </h3>
              <span style={{ fontSize: '12px', color: '#94a3b8', fontFamily: 'JetBrains Mono' }}>
                Invoice #{invoiceNumber}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '6px',
            }}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
          {/* Customer & Invoice Breakdown Banner */}
          <div
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '10px',
              padding: '14px 16px',
              marginBottom: '20px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <div>
                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>
                  CUSTOMER
                </span>
                <strong style={{ display: 'block', fontSize: '14px', color: '#0f172a' }}>{customerName}</strong>
                <span style={{ fontSize: '12px', color: '#64748b' }}>{customerMobile}</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>
                  INVOICE DATE
                </span>
                <strong style={{ display: 'block', fontSize: '13px', color: '#0f172a' }}>
                  {formatDate(invoice.createdAt || Date.now())}
                </strong>
              </div>
            </div>

            {/* Financial Status Metrics Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                gap: '8px',
                paddingTop: '10px',
                borderTop: '1px dashed #cbd5e1',
              }}
            >
              <div>
                <span style={{ fontSize: '10px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>
                  Invoice Total
                </span>
                <strong style={{ display: 'block', fontSize: '14px', color: '#0f172a' }}>
                  {formatCurrency(totalAmount)}
                </strong>
              </div>
              <div>
                <span style={{ fontSize: '10px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>
                  Already Paid
                </span>
                <strong style={{ display: 'block', fontSize: '14px', color: '#059669' }}>
                  {formatCurrency(totalPaid)}
                </strong>
              </div>
              <div>
                <span style={{ fontSize: '10px', color: '#dc2626', fontWeight: '700', textTransform: 'uppercase' }}>
                  Current Due
                </span>
                <strong style={{ display: 'block', fontSize: '15px', color: '#dc2626', fontWeight: '800' }}>
                  {formatCurrency(currentDue)}
                </strong>
              </div>
            </div>
          </div>

          {/* Validation Alert */}
          {validationError && (
            <div
              style={{
                background: '#fef2f2',
                border: '1px solid #fca5a5',
                color: '#991b1b',
                padding: '10px 14px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: '600',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{validationError}</span>
            </div>
          )}

          {/* Payment Amount Input */}
          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label className="form-label" style={{ fontWeight: '700', color: '#0f172a' }}>
              Payment Amount Received (₹) *
            </label>
            <div className="input-wrapper">
              <span className="input-icon">₹</span>
              <input
                type="number"
                step="any"
                min="1"
                max={currentDue}
                className="input-control input-with-icon"
                style={{
                  fontSize: '16px',
                  fontWeight: '700',
                  color: '#0f172a',
                  borderColor: validationError ? '#ef4444' : '#cbd5e1',
                }}
                value={amount}
                onChange={(e) => handleAmountChange(e.target.value)}
                placeholder="Enter amount"
                required
                disabled={isSubmitting}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
              <span style={{ fontSize: '11px', color: '#64748b' }}>
                Quick Fill:
              </span>
              <button
                type="button"
                onClick={() => handleAmountChange(String(currentDue))}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#2563eb',
                  fontSize: '11px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                Pay Full Balance (₹{currentDue.toLocaleString()})
              </button>
            </div>
          </div>

          {/* Payment Method & Date */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Payment Method *</label>
              <select
                className="select-control"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                disabled={isSubmitting}
                required
              >
                <option value="Cash">Cash</option>
                <option value="UPI">UPI / QR Code</option>
                <option value="Card">Credit / Debit Card</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Other">Other Mode</option>
              </select>
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Payment Date</label>
              <input
                type="date"
                className="input-control"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                disabled={isSubmitting}
                required
              />
            </div>
          </div>

          {/* Optional Notes */}
          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label className="form-label">Notes & Settlement Reference (Optional)</label>
            <input
              type="text"
              className="input-control"
              placeholder="e.g. Received via GPay / Handover Cash"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting || Boolean(validationError) || !amount || Number(amount) <= 0}
              style={{
                minWidth: '160px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              {isSubmitting ? (
                'Processing...'
              ) : (
                <>
                  <Check size={16} /> Confirm Payment
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
