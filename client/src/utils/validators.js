/**
 * Price & Financial Input Validator
 * Validates that financial inputs are finite, non-negative numbers rounded up to 2 decimal places.
 */
export const validatePrice = (val, fieldName = 'Amount', allowEmpty = false) => {
  if (allowEmpty && (val === '' || val === null || val === undefined)) {
    return { isValid: true, value: 0 };
  }

  const str = String(val).trim();
  if (!str) {
    if (allowEmpty) return { isValid: true, value: 0 };
    return { isValid: false, error: `${fieldName} is required`, value: 0 };
  }

  const num = Number(str);
  if (isNaN(num) || !isFinite(num)) {
    return { isValid: false, error: `${fieldName} must be a valid numeric number`, value: 0 };
  }

  if (num < 0) {
    return { isValid: false, error: `${fieldName} cannot be negative`, value: 0 };
  }

  // Max 2 decimal places precision normalization
  const normalized = Math.round(num * 100) / 100;
  return { isValid: true, value: normalized };
};
