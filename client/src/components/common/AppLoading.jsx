import React from 'react';
import { Wrench } from 'lucide-react';

export const AppLoading = ({ message = 'Loading Zapate Service Manager...' }) => {
  return (
    <div
      className="app-loading"
      style={{
        minHeight: '100vh',
        width: '100vw',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0f172a',
        color: '#f8fafc',
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 99999,
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '20px',
        }}
      >
        {/* Brand Lockup */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 8px 20px rgba(37, 99, 235, 0.4)',
            }}
          >
            <Wrench size={22} />
          </div>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#ffffff', letterSpacing: '-0.02em', margin: 0, lineHeight: 1.2 }}>
              Zapate Service Manager
            </h2>
            <span style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#60a5fa' }}>
              WORKSHOP OS
            </span>
          </div>
        </div>

        {/* Animated Spinner */}
        <div
          style={{
            width: '32px',
            height: '32px',
            border: '3px solid rgba(96, 165, 250, 0.2)',
            borderTopColor: '#3b82f6',
            borderRadius: '50%',
            animation: 'rf-spin 0.8s linear infinite',
            marginTop: '8px',
          }}
        />

        {/* Message */}
        <span
          style={{
            fontSize: '13px',
            fontWeight: '600',
            color: '#94a3b8',
            letterSpacing: '0.02em',
          }}
        >
          {message}
        </span>
      </div>

      <style>{`
        @keyframes rf-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
