import React, { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';

export const BarcodeGenerator = ({ value, format = 'CODE128', width = 1.4, height = 40, displayValue = true, fontSize = 11 }) => {
  const svgRef = useRef(null);

  useEffect(() => {
    if (!svgRef.current || !value) return;
    try {
      JsBarcode(svgRef.current, String(value).trim(), {
        format,
        lineColor: '#0f172a',
        width,
        height,
        displayValue,
        fontSize,
        font: 'JetBrains Mono, monospace',
        fontOptions: 'bold',
        textMargin: 3,
        margin: 4,
        background: 'transparent',
      });
    } catch (err) {
      console.warn('[BarcodeGenerator] Error generating barcode:', err.message);
    }
  }, [value, format, width, height, displayValue, fontSize]);

  if (!value) return null;

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '6px 0' }}>
      <svg ref={svgRef} style={{ maxWidth: '100%', height: 'auto' }} />
    </div>
  );
};
