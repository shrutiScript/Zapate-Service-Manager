import React, { useMemo } from 'react';
import { DEVICE_BRANDS, getModelsForCompany } from '../../constants/deviceCatalog.js';

export const DependentDeviceSelect = ({
  selectedBrand = '',
  selectedModel = '',
  onBrandChange,
  onModelChange,
  brandLabel = 'Company / Brand *',
  modelLabel = 'Device Model *',
  required = true,
  disabled = false,
  gridClass = 'form-grid-2',
}) => {
  const models = useMemo(() => {
    return getModelsForCompany(selectedBrand);
  }, [selectedBrand]);

  const handleBrandSelect = (e) => {
    const nextBrand = e.target.value;
    onBrandChange(nextBrand);
    onModelChange(''); // Strictly reset model when brand changes
  };

  return (
    <div className={gridClass} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
      <div className="form-group">
        <label className="form-label">{brandLabel}</label>
        <select
          className="select-control"
          value={selectedBrand}
          onChange={handleBrandSelect}
          required={required}
          disabled={disabled}
        >
          <option value="">-- Select Company --</option>
          {DEVICE_BRANDS.map((b) => (
            <option key={b.id} value={b.name}>
              {b.name}
            </option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label className="form-label">{modelLabel}</label>
        <select
          className="select-control"
          value={selectedModel}
          onChange={(e) => onModelChange(e.target.value)}
          required={required}
          disabled={disabled || !selectedBrand.trim()}
        >
          {!selectedBrand.trim() ? (
            <option value="">-- Select Company First --</option>
          ) : models.length === 0 ? (
            <option value="">No models available for this company</option>
          ) : (
            <>
              <option value="">-- Select Model --</option>
              {models.map((m) => (
                <option key={m.id} value={m.modelName}>
                  {m.modelName}
                </option>
              ))}
              <option value="Custom Model">Other / Custom Model</option>
            </>
          )}
        </select>
      </div>
    </div>
  );
};
