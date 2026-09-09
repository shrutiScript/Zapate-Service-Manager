import React, { useState } from 'react';
import { PatternLockGrid } from './PatternLockGrid.jsx';
import {
  Lock,
  Eye,
  EyeOff,
  ShieldAlert,
  Info,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  Fingerprint,
  UserCheck,
} from 'lucide-react';

export const lockTypeOptions = [
  'No Lock',
  'PIN',
  'Pattern Lock',
  'Password',
  'Biometric Only',
  'Customer Will Unlock',
];

export const DeviceAccessInput = ({
  lockType = 'No Lock',
  accessAvailable = 'Yes',
  credential = '',
  onChange,
  isDisabled = false,
}) => {
  const [showSecret, setShowSecret] = useState(false);

  const handleLockTypeChange = (newLockType) => {
    const defaultAccess = newLockType === 'Customer Will Unlock' ? 'No' : 'Yes';
    if (onChange) {
      onChange({
        lockType: newLockType,
        accessAvailable: defaultAccess,
        credential: newLockType === lockType ? credential : '',
      });
    }
  };

  const handleAccessAvailableChange = (newAccess) => {
    if (onChange) {
      onChange({
        lockType,
        accessAvailable: newAccess,
        credential,
      });
    }
  };

  const handleCredentialChange = (newCred) => {
    if (onChange) {
      onChange({
        lockType,
        accessAvailable,
        credential: newCred,
      });
    }
  };

  const handlePinInput = (e) => {
    // Restrict PIN to digits only
    const val = e.target.value.replace(/\D/g, '');
    handleCredentialChange(val);
  };

  return (
    <div
      style={{
        marginTop: '16px',
        padding: '16px',
        background: '#f8fafc',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '14px',
        }}
      >
        <Lock size={16} style={{ color: '#2563eb' }} />
        <strong style={{ fontSize: '14px', color: '#0f172a' }}>
          Device Access Information
        </strong>
      </div>

      {/* Selectors Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Lock Type</label>
          <select
            className="select-control"
            value={lockType}
            onChange={(e) => handleLockTypeChange(e.target.value)}
            disabled={isDisabled}
          >
            {lockTypeOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Access Available</label>
          <select
            className="select-control"
            value={accessAvailable}
            onChange={(e) => handleAccessAvailableChange(e.target.value)}
            disabled={isDisabled}
          >
            <option value="Yes">Yes</option>
            <option value="No">No</option>
          </select>
        </div>
      </div>

      {/* Dynamic Content Area based on Access Available & Lock Type */}
      <div style={{ marginTop: '12px' }}>
        {accessAvailable === 'No' ? (
          /* ACCESS AVAILABLE = NO */
          <div
            style={{
              padding: '12px 14px',
              background: '#fef2f2',
              borderRadius: '8px',
              border: '1px solid #fecaca',
              color: '#991b1b',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <AlertCircle size={16} style={{ flexShrink: 0, color: '#dc2626' }} />
            <span>Device access is currently not available.</span>
          </div>
        ) : (
          /* ACCESS AVAILABLE = YES */
          <>
            {lockType === 'No Lock' && (
              <div
                style={{
                  padding: '12px 14px',
                  background: '#f0fdf4',
                  borderRadius: '8px',
                  border: '1px solid #bbf7d0',
                  color: '#166534',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <CheckCircle2 size={16} style={{ flexShrink: 0, color: '#16a34a' }} />
                <span>No device lock is enabled.</span>
              </div>
            )}

            {lockType === 'PIN' && (
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Secure Numeric PIN Entry (Digits Only)</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showSecret ? 'text' : 'password'}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    className="input-control"
                    placeholder="Enter numeric PIN (e.g. 1234)"
                    value={credential}
                    onChange={handlePinInput}
                    disabled={isDisabled}
                    style={{ paddingRight: '40px', fontFamily: 'JetBrains Mono, monospace' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowSecret(!showSecret)}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: '#64748b',
                      cursor: 'pointer',
                    }}
                    title={showSecret ? 'Hide PIN' : 'Show PIN'}
                  >
                    {showSecret ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            )}

            {lockType === 'Pattern Lock' && (
              <div>
                <PatternLockGrid
                  value={credential}
                  onChange={(patternArr) => handleCredentialChange(JSON.stringify(patternArr))}
                  isReadOnly={isDisabled}
                />
              </div>
            )}

            {lockType === 'Password' && (
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Secure Device Password Entry</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showSecret ? 'text' : 'password'}
                    className="input-control"
                    placeholder="Enter device unlock password"
                    value={credential}
                    onChange={(e) => handleCredentialChange(e.target.value)}
                    disabled={isDisabled}
                    style={{ paddingRight: '40px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowSecret(!showSecret)}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: '#64748b',
                      cursor: 'pointer',
                    }}
                    title={showSecret ? 'Hide Password' : 'Show Password'}
                  >
                    {showSecret ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            )}

            {lockType === 'Biometric Only' && (
              <div
                style={{
                  padding: '12px 14px',
                  background: '#eff6ff',
                  borderRadius: '8px',
                  border: '1px solid #bfdbfe',
                  color: '#1e40af',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <Fingerprint size={16} style={{ flexShrink: 0, color: '#2563eb' }} />
                <span>Customer must unlock the device for authorized repair and testing.</span>
              </div>
            )}

            {lockType === 'Customer Will Unlock' && (
              <div
                style={{
                  padding: '12px 14px',
                  background: '#fffbeb',
                  borderRadius: '8px',
                  border: '1px solid #fef3c7',
                  color: '#92400e',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <UserCheck size={16} style={{ flexShrink: 0, color: '#d97706' }} />
                <span>Customer will provide device access when required.</span>
              </div>
            )}
          </>
        )}
      </div>

      {/* Security Warning Notice */}
      <div
        style={{
          marginTop: '14px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '6px',
          padding: '8px 10px',
          background: '#fffbeb',
          borderRadius: '6px',
          border: '1px solid #fef3c7',
          fontSize: '11px',
          color: '#92400e',
        }}
      >
        <ShieldAlert size={14} style={{ flexShrink: 0, marginTop: '1px', color: '#d97706' }} />
        <span>
          Device access information is sensitive and should only be used for authorized repair and testing.
        </span>
      </div>
    </div>
  );
};
