export function errorMiddleware(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  console.error(`[Error] ${req.method} ${req.originalUrl} - ${statusCode}: ${message}`);

  res.status(statusCode).json({
    success: false,
    message,
    availableStock: err.availableStock !== undefined ? err.availableStock : undefined,
    requestedQuantity: err.requestedQuantity !== undefined ? err.requestedQuantity : undefined,
    partId: err.partId || undefined,
    partName: err.partName || undefined,
    unitPrice: err.unitPrice !== undefined ? err.unitPrice : undefined,
    isDuplicate: err.isDuplicate || undefined,
    duplicateField: err.duplicateField || undefined,
    existingValue: err.existingValue || undefined,
    isBlocked: err.isBlocked !== undefined ? err.isBlocked : undefined,
    isExpired: err.isExpired !== undefined ? err.isExpired : undefined,
    subscriptionExpired: err.subscriptionExpired !== undefined ? err.subscriptionExpired : undefined,
    shopId: err.shopId || undefined,
    shopName: err.shopName || undefined,
    plan: err.plan || undefined,
    expiresAt: err.expiresAt || undefined,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
}
