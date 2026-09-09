import React, { useState, useRef, useEffect } from 'react';
import { Eye, EyeOff, RotateCcw, Trash2, CheckCircle2 } from 'lucide-react';

export const PatternLockGrid = ({ value = [], onChange, isReadOnly = false }) => {
  // Parse value: can be array [1,2,5,8] or JSON string "[1,2,5,8]" or string "1-2-5-8"
  const parsePattern = (val) => {
    if (!val) return [];
    if (Array.isArray(val)) return val;
    if (typeof val === 'string') {
      try {
        const parsed = JSON.parse(val);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        // fallback string split
      }
      return val.split(/[-,\s]+/).map(Number).filter((n) => !isNaN(n) && n >= 1 && n <= 9);
    }
    return [];
  };

  const [pattern, setPattern] = useState(() => parsePattern(value));
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [showPattern, setShowPattern] = useState(!isReadOnly);
  const containerRef = useRef(null);

  useEffect(() => {
    setPattern(parsePattern(value));
  }, [value]);

  const dots = [
    { id: 1, row: 0, col: 0 },
    { id: 2, row: 0, col: 1 },
    { id: 3, row: 0, col: 2 },
    { id: 4, row: 1, col: 0 },
    { id: 5, row: 1, col: 1 },
    { id: 6, row: 1, col: 2 },
    { id: 7, row: 2, col: 0 },
    { id: 8, row: 2, col: 1 },
    { id: 9, row: 2, col: 2 },
  ];

  const handleDotSelect = (dotId) => {
    if (isReadOnly) return;
    if (!pattern.includes(dotId)) {
      const next = [...pattern, dotId];
      setPattern(next);
      if (onChange) onChange(next);
    }
  };

  const handleMouseDown = (dotId) => {
    if (isReadOnly) return;
    setIsMouseDown(true);
    handleDotSelect(dotId);
  };

  const handleMouseEnter = (dotId) => {
    if (isReadOnly || !isMouseDown) return;
    handleDotSelect(dotId);
  };

  const handleMouseUp = () => {
    setIsMouseDown(false);
  };

  useEffect(() => {
    const handleGlobalMouseUp = () => setIsMouseDown(false);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, []);

  const handleClear = () => {
    if (isReadOnly) return;
    setPattern([]);
    if (onChange) onChange([]);
  };

  // Helper to compute dot pixel positions inside a 240x240 box
  const getDotPos = (id) => {
    const d = dots.find((item) => item.id === id);
    if (!d) return { x: 0, y: 0 };
    // Center of grid cells in 240x240 box
    // cols: 0->40, 1->120, 2->200
    // rows: 0->40, 1->120, 2->200
    return {
      x: 40 + d.col * 80,
      y: 40 + d.row * 80,
    };
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        background: '#f8fafc',
        padding: '16px',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        userSelect: 'none',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '100%',
          maxWidth: '260px',
          marginBottom: '10px',
        }}
      >
        <span style={{ fontSize: '12px', fontWeight: '700', color: '#475569' }}>
          3x3 Pattern Lock Grid
        </span>
        <button
          type="button"
          onClick={() => setShowPattern(!showPattern)}
          style={{
            background: 'none',
            border: 'none',
            color: '#2563eb',
            fontSize: '11px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          {showPattern ? <EyeOff size={13} /> : <Eye size={13} />}
          {showPattern ? 'Hide Pattern' : 'Show Pattern'}
        </button>
      </div>

      {/* 3x3 Canvas / SVG Overlay */}
      <div
        ref={containerRef}
        onMouseUp={handleMouseUp}
        style={{
          position: 'relative',
          width: '240px',
          height: '240px',
          background: '#ffffff',
          borderRadius: '16px',
          border: '2px solid #cbd5e1',
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
          touchAction: 'none',
        }}
      >
        {/* SVG Lines Connecting Dots */}
        <svg
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            zIndex: 1,
          }}
        >
          {showPattern &&
            pattern.map((dotId, index) => {
              if (index === 0) return null;
              const prevPos = getDotPos(pattern[index - 1]);
              const currPos = getDotPos(dotId);
              return (
                <line
                  key={`${pattern[index - 1]}-${dotId}-${index}`}
                  x1={prevPos.x}
                  y1={prevPos.y}
                  x2={currPos.x}
                  y2={currPos.y}
                  stroke="#2563eb"
                  strokeWidth="5"
                  strokeLinecap="round"
                  opacity="0.85"
                />
              );
            })}
        </svg>

        {/* 9 Grid Dots */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gridTemplateRows: 'repeat(3, 1fr)',
            width: '100%',
            height: '100%',
            position: 'relative',
            zIndex: 2,
          }}
        >
          {dots.map((dot) => {
            const indexInPattern = pattern.indexOf(dot.id);
            const isSelected = indexInPattern !== -1;
            return (
              <div
                key={dot.id}
                onMouseDown={() => handleMouseDown(dot.id)}
                onMouseEnter={() => handleMouseEnter(dot.id)}
                onTouchStart={() => handleMouseDown(dot.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: isReadOnly ? 'default' : 'pointer',
                }}
              >
                <div
                  style={{
                    width: isSelected ? '24px' : '16px',
                    height: isSelected ? '24px' : '16px',
                    borderRadius: '50%',
                    background: isSelected && showPattern ? '#2563eb' : isSelected ? '#475569' : '#94a3b8',
                    boxShadow: isSelected
                      ? '0 0 0 6px rgba(37, 99, 235, 0.25)'
                      : 'none',
                    transition: 'all 0.15s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    fontSize: '10px',
                    fontWeight: '700',
                  }}
                >
                  {isSelected && showPattern ? indexInPattern + 1 : ''}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Control Buttons */}
      {!isReadOnly && (
        <div
          style={{
            display: 'flex',
            gap: '10px',
            marginTop: '12px',
            width: '100%',
            maxWidth: '240px',
            justifyContent: 'center',
          }}
        >
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleClear}
            disabled={pattern.length === 0}
            style={{ fontSize: '11px', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
          >
            <RotateCcw size={12} /> Clear Pattern
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleClear}
            disabled={pattern.length === 0}
            style={{ fontSize: '11px', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', color: '#ef4444' }}
          >
            <Trash2 size={12} /> Reset
          </button>
        </div>
      )}

      {/* Feedback status */}
      <div style={{ marginTop: '10px', textAlign: 'center' }}>
        {pattern.length >= 2 ? (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '11px',
              fontWeight: '700',
              color: '#059669',
              background: '#ecfdf5',
              padding: '4px 10px',
              borderRadius: '20px',
              border: '1px solid #a7f3d0',
            }}
          >
            <CheckCircle2 size={13} /> Pattern recorded successfully ({pattern.length} points)
          </div>
        ) : (
          <span style={{ fontSize: '11px', color: '#64748b' }}>
            {isReadOnly ? 'Pattern locked' : 'Connect dots to record pattern lock'}
          </span>
        )}
      </div>
    </div>
  );
};
