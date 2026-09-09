import React, { useState, useEffect } from 'react';
import { AiDiagnosticModal } from '../common/AiDiagnosticModal.jsx';
import { X, Sparkles } from 'lucide-react';

export const AiFloatingAssistant = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showTooltip, setShowTooltip] = useState(true);
  const [isHovered, setIsHovered] = useState(false);

  // Automatically dismiss initial tooltip after 5 seconds to never block content
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowTooltip(false);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      {/* Floating Robot Widget Root */}
      <div
        className="ai-assistant-floating-root"
        style={{
          position: 'fixed',
          bottom: '28px',
          right: '28px',
          zIndex: 95,
          display: 'flex',
          alignItems: 'center',
          pointerEvents: 'none',
        }}
      >
        {/* Compact Tooltip (Positioned to the left of the button, temporary / on hover) */}
        {(showTooltip || isHovered) && (
          <div
            className="ai-assistant-bubble"
            onClick={() => setIsModalOpen(true)}
            style={{
              pointerEvents: 'auto',
              background: '#ffffff',
              color: '#0f172a',
              padding: '8px 14px',
              borderRadius: '12px',
              boxShadow: '0 10px 25px -4px rgba(15, 23, 42, 0.18), 0 0 1px rgba(0,0,0,0.1)',
              border: '1px solid #e2e8f0',
              marginRight: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              animation: 'aiBubbleFadeIn 0.25s ease-out forwards',
              whiteSpace: 'nowrap',
              position: 'relative',
            }}
          >
            <div
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#38bdf8',
                boxShadow: '0 0 6px #38bdf8',
                flexShrink: 0,
              }}
            />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '12px', fontWeight: '800', color: '#0f172a', lineHeight: '1.2' }}>
                Zapate AI Assistant
              </span>
              <span style={{ fontSize: '10.5px', color: '#64748b' }}>
                Click to diagnose device issues
              </span>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowTooltip(false);
              }}
              style={{
                border: 'none',
                background: 'transparent',
                color: '#94a3b8',
                cursor: 'pointer',
                padding: '2px',
                marginLeft: '4px',
                display: 'flex',
                borderRadius: '50%',
              }}
              title="Dismiss"
            >
              <X size={12} />
            </button>

            {/* Triangle tail pointing towards the robot button */}
            <div
              style={{
                position: 'absolute',
                right: '-5px',
                top: '50%',
                transform: 'translateY(-50%) rotate(45deg)',
                width: '10px',
                height: '10px',
                background: '#ffffff',
                borderRight: '1px solid #e2e8f0',
                borderTop: '1px solid #e2e8f0',
              }}
            />
          </div>
        )}

        {/* Compact Animated Robot Orb Button (56px) */}
        <div
          className="ai-robot-launcher-btn"
          onClick={() => setIsModalOpen(true)}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          style={{
            pointerEvents: 'auto',
            cursor: 'pointer',
            width: '58px',
            height: '58px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            border: '2px solid #38bdf8',
            boxShadow: '0 8px 24px rgba(15, 23, 42, 0.25), 0 0 16px rgba(56, 189, 248, 0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s ease',
            animation: 'aiRobotFloat 3.5s ease-in-out infinite',
            flexShrink: 0,
          }}
          title="Open Zapate AI Assistant"
        >
          {/* Subtle Ambient Pulse Ring */}
          <div
            style={{
              position: 'absolute',
              inset: '-4px',
              borderRadius: '50%',
              border: '1px solid rgba(56, 189, 248, 0.4)',
              animation: 'aiAuraPulse 2.8s ease-in-out infinite',
              pointerEvents: 'none',
            }}
          />

          {/* Illustrated 3D Robot Face (Compact SVG) */}
          <svg
            width="36"
            height="36"
            viewBox="0 0 64 64"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Antenna */}
            <circle cx="32" cy="7" r="3" fill="#38bdf8" className="antenna-glow" />
            <line x1="32" y1="10" x2="32" y2="16" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" />

            {/* Side Ear Sensors */}
            <rect x="8" y="24" width="4" height="12" rx="2" fill="#3b82f6" />
            <rect x="52" y="24" width="4" height="12" rx="2" fill="#3b82f6" />

            {/* Robot Head Shape */}
            <rect x="12" y="15" width="40" height="32" rx="16" fill="url(#robotHeadGrad)" stroke="#93c5fd" strokeWidth="1.8" />

            {/* Dark Glossy Visor */}
            <rect x="17" y="21" width="30" height="18" rx="9" fill="#0b1329" />

            {/* Happy Glowing Cyan Eyes (^ ^) */}
            <path d="M 22 30 Q 25 26 28 30" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            <path d="M 36 30 Q 39 26 42 30" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" fill="none" />

            {/* Visor Glare */}
            <ellipse cx="23" cy="24" rx="2.5" ry="1.2" fill="#ffffff" opacity="0.6" transform="rotate(-15 23 24)" />

            {/* Cheerful Mouth / Audio Visualizer Bar */}
            <line x1="28" y1="35" x2="36" y2="35" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />

            {/* Gradients */}
            <defs>
              <linearGradient id="robotHeadGrad" x1="12" y1="15" x2="52" y2="47" gradientUnits="userSpaceOnUse">
                <stop stopColor="#ffffff" />
                <stop offset="0.75" stopColor="#eff6ff" />
                <stop offset="1" stopColor="#bfdbfe" />
              </linearGradient>
            </defs>
          </svg>

          {/* Mini AI Badge Indicator on Bottom Edge */}
          <div
            style={{
              position: 'absolute',
              bottom: '-3px',
              right: '-2px',
              background: '#2563eb',
              color: '#ffffff',
              fontSize: '8.5px',
              fontWeight: '900',
              padding: '1px 5px',
              borderRadius: '6px',
              border: '1.5px solid #ffffff',
              letterSpacing: '0.3px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
            }}
          >
            AI
          </div>
        </div>
      </div>

      {/* Embedded AI Diagnostic Modal */}
      <AiDiagnosticModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

      {/* Animation Styles */}
      <style>{`
        @keyframes aiRobotFloat {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-5px);
          }
        }

        @keyframes aiAuraPulse {
          0%, 100% {
            transform: scale(0.96);
            opacity: 0.35;
          }
          50% {
            transform: scale(1.15);
            opacity: 0.8;
          }
        }

        @keyframes aiBubbleFadeIn {
          0% {
            opacity: 0;
            transform: translateX(10px) scale(0.94);
          }
          100% {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }

        .antenna-glow {
          animation: antennaFlash 2s infinite ease-in-out;
        }

        @keyframes antennaFlash {
          0%, 100% { fill: #38bdf8; opacity: 1; }
          50% { fill: #60a5fa; opacity: 0.5; }
        }

        .ai-robot-launcher-btn:hover {
          transform: scale(1.08) translateY(-2px) !important;
          box-shadow: 0 12px 28px rgba(15, 23, 42, 0.35), 0 0 20px rgba(56, 189, 248, 0.5) !important;
        }

        @media (max-width: 640px) {
          .ai-assistant-floating-root {
            bottom: 18px !important;
            right: 18px !important;
          }
          .ai-robot-launcher-btn {
            width: 50px !important;
            height: 50px !important;
          }
          .ai-assistant-bubble {
            display: none !important;
          }
        }
      `}</style>
    </>
  );
};
