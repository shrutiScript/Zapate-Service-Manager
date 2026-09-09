import React, { useEffect } from 'react';
import { AlertTriangle, Package, Check, X, ShieldAlert, ArrowRight, Tag } from 'lucide-react';
import { formatCurrency } from '../../../utils/formatters.js';

export const StockValidationModal = ({
  isOpen,
  item,
  requestedQty,
  availableStock,
  onConfirm,
  onCancel,
}) => {
  // Handle ESC / Enter keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onCancel?.();
      } else if (e.key === 'Enter') {
        onConfirm?.(availableStock);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, availableStock, onConfirm, onCancel]);

  if (!isOpen || !item) return null;

  const itemName = item.name || item.partName || 'Spare Part / Product';
  const itemBrand = item.brand || item.compatibleModel || '';
  const itemModel = item.model || '';
  const itemSku = item.sku || '';
  const itemPrice = Number(item.price || item.sellingPrice || item.unitPrice || 0);
  const adjustedTotal = availableStock * itemPrice;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1100,
        padding: '16px',
        animation: 'fadeIn 0.15s ease-out',
      }}
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-labelledby="stock-modal-title"
    >
      <div
        className="card"
        style={{
          maxWidth: '500px',
          width: '100%',
          padding: '0',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(245, 158, 11, 0.25)',
          overflow: 'hidden',
          background: '#ffffff',
          animation: 'slideUp 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header Strip */}
        <div
          style={{
            padding: '20px 24px',
            background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
            borderBottom: '1px solid #fde68a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(245, 158, 11, 0.35)',
                flexShrink: 0,
              }}
            >
              <AlertTriangle size={22} />
            </div>
            <div>
              <h2
                id="stock-modal-title"
                style={{
                  fontSize: '17px',
                  fontWeight: '800',
                  color: '#92400e',
                  margin: 0,
                  letterSpacing: '-0.02em',
                }}
              >
                Stock Availability Confirmation
              </h2>
              <p style={{ fontSize: '12px', color: '#b45309', margin: '2px 0 0 0' }}>
                Verify requested quantity against available inventory
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onCancel}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: '#92400e',
              padding: '6px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.15s ease',
            }}
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body Content */}
        <div style={{ padding: '24px' }}>
          {/* Target Product Info Pill */}
          <div
            style={{
              padding: '12px 14px',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '10px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
            }}
          >
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Package size={14} style={{ color: '#64748b', flexShrink: 0 }} />
                <strong
                  style={{
                    fontSize: '13px',
                    color: '#0f172a',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: 'block',
                  }}
                >
                  {itemName}
                </strong>
              </div>
              {(itemBrand || itemModel || itemSku) && (
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                  {[itemBrand, itemModel, itemSku ? `SKU: ${itemSku}` : null].filter(Boolean).join(' • ')}
                </div>
              )}
            </div>

            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontSize: '10px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>Unit Price</div>
              <span style={{ fontSize: '14px', fontWeight: '800', color: '#2563eb' }}>
                {formatCurrency(itemPrice)}
              </span>
            </div>
          </div>

          {/* Side-by-Side Quantity Stat Metric Cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px',
              marginBottom: '16px',
            }}
          >
            {/* Available Stock Card */}
            <div
              style={{
                padding: '14px',
                borderRadius: '10px',
                background: '#ecfdf5',
                border: '1.5px solid #a7f3d0',
                textAlign: 'center',
              }}
            >
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: '700',
                  color: '#065f46',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  display: 'block',
                  marginBottom: '4px',
                }}
              >
                Available Stock
              </span>
              <strong style={{ fontSize: '26px', fontWeight: '900', color: '#059669' }}>
                {availableStock}
              </strong>
              <span style={{ fontSize: '11px', color: '#047857', display: 'block', marginTop: '2px' }}>
                Items available
              </span>
            </div>

            {/* Requested Quantity Card */}
            <div
              style={{
                padding: '14px',
                borderRadius: '10px',
                background: '#fef2f2',
                border: '1.5px solid #fecaca',
                textAlign: 'center',
              }}
            >
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: '700',
                  color: '#991b1b',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  display: 'block',
                  marginBottom: '4px',
                }}
              >
                Requested Quantity
              </span>
              <strong style={{ fontSize: '26px', fontWeight: '900', color: '#dc2626' }}>
                {requestedQty}
              </strong>
              <span style={{ fontSize: '11px', color: '#b91c1c', display: 'block', marginTop: '2px' }}>
                Items requested
              </span>
            </div>
          </div>

          {/* Explanatory Confirmation Banner (Exact requested prompt) */}
          <div
            style={{
              padding: '14px 16px',
              background: '#fffbeb',
              border: '1px solid #fde68a',
              borderLeft: '4px solid #f59e0b',
              borderRadius: '8px',
              marginBottom: '16px',
            }}
          >
            <p style={{ margin: '0 0 6px 0', fontSize: '13px', color: '#92400e', lineHeight: '1.5' }}>
              Only <strong>{availableStock} items</strong> are currently available in stock.
              <br />
              You requested <strong>{requestedQty} items</strong>.
            </p>
            <p style={{ margin: 0, fontSize: '13px', fontWeight: '700', color: '#78350f', lineHeight: '1.4' }}>
              Would you like to continue with the available quantity of {availableStock} at the same unit price?
            </p>
          </div>

          {/* Pricing & Calculation Summary */}
          <div
            style={{
              padding: '12px 14px',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '12px',
            }}
          >
            <div style={{ color: '#64748b' }}>
              <span>Calculation: </span>
              <strong style={{ color: '#0f172a' }}>{availableStock} × {formatCurrency(itemPrice)}</strong>
              <span style={{ fontSize: '11px', display: 'block', color: '#059669', marginTop: '1px' }}>
                ✓ Same unit price maintained ({formatCurrency(itemPrice)})
              </span>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>Adjusted Total</span>
              <strong style={{ fontSize: '15px', color: '#0f172a', fontWeight: '800' }}>
                {formatCurrency(adjustedTotal)}
              </strong>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onCancel}
              style={{
                padding: '10px 18px',
                fontSize: '13px',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                flex: '1',
                justifyContent: 'center',
              }}
            >
              <X size={15} />
              <span>Cancel</span>
            </button>

            <button
              type="button"
              className="btn btn-primary"
              onClick={() => onConfirm?.(availableStock)}
              style={{
                padding: '10px 20px',
                fontSize: '13px',
                fontWeight: '800',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                flex: '1.5',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                borderColor: '#047857',
                boxShadow: '0 4px 12px rgba(5, 150, 105, 0.3)',
              }}
              autoFocus
            >
              <Check size={16} />
              <span>Continue with {availableStock} Items</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockValidationModal;
