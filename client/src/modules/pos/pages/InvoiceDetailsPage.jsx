import React, { useEffect, useState } from 'react';
import { useRoute, useLocation } from 'wouter';
import { MainLayout } from '../../../components/layout/MainLayout.jsx';
import { InvoiceReceiptView } from '../components/InvoiceReceiptView.jsx';
import { ArrowLeft, FileText, AlertCircle } from 'lucide-react';
import api from '../../../services/api.js';

export const InvoiceDetailsPage = () => {
  const [, params1] = useRoute('/pos/invoices/:id');
  const [, params2] = useRoute('/invoices/:id');
  const [, navigate] = useLocation();

  const id = params1?.id || params2?.id;
  const [invoice, setInvoice] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    setError(null);

    api.get(`/pos/invoices/${id}`)
      .then((res) => {
        const data = res?.data || res;
        if (data && (data._id || data.id || data.number)) {
          setInvoice(data);
        } else {
          setError('Invoice not found.');
        }
      })
      .catch((err) => {
        setError(err.message || 'Failed to load invoice or access unauthorized.');
      })
      .finally(() => setIsLoading(false));
  }, [id]);

  return (
    <MainLayout title="Invoice Receipt" subtitle="Digital Bill & Workshop Voucher">
      <div className="page-header no-print">
        <div className="page-header-info">
          <div className="page-badge-eyebrow">
            <span /> DIGITAL RECEIPT
          </div>
          <h1>Invoice #{invoice?.number || id}</h1>
          <p>Official workshop tax receipt, repair service voucher, and warranty terms.</p>
        </div>

        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => navigate('/pos')}
        >
          <ArrowLeft size={16} /> Back to POS Billing
        </button>
      </div>

      {isLoading ? (
        <div className="card" style={{ textAlign: 'center', padding: '64px 20px' }}>
          <div style={{ fontSize: '14px', color: '#64748b' }}>Loading invoice details...</div>
        </div>
      ) : error ? (
        <div className="card" style={{ textAlign: 'center', padding: '64px 20px' }}>
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
            <AlertCircle size={24} />
          </div>
          <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>
            Invoice Unavailable
          </h3>
          <p style={{ fontSize: '14px', color: '#64748b', maxWidth: '400px', margin: '0 auto 20px' }}>
            {error}
          </p>
          <button type="button" className="btn btn-primary" onClick={() => navigate('/pos')}>
            <ArrowLeft size={14} /> Return to POS Billing
          </button>
        </div>
      ) : (
        <div style={{ maxWidth: '680px', margin: '0 auto', paddingBottom: '40px' }}>
          <InvoiceReceiptView invoice={invoice} standalone={true} />
        </div>
      )}
    </MainLayout>
  );
};
