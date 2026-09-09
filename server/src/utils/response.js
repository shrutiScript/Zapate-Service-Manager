export function sendSuccess(res, data, message = 'Success', statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
}

export function sendCreated(res, data, message = 'Created successfully') {
  return res.status(201).json({
    success: true,
    message,
    data,
  });
}

export function sendError(res, message = 'An error occurred', statusCode = 400) {
  return res.status(statusCode).json({
    success: false,
    message,
  });
}
