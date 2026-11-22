
function notFoundHandler(req, res) {
  return res.status(404).json({
    success: false,
    message: 'API endpoint not found.',
  });
}

function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    return next(error);
  }

  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({ success: false, message: 'Invalid JSON request body.' });
  }

  if (error.type === 'entity.too.large') {
    return res.status(413).json({ success: false, message: 'Request body is too large.' });
  }

  console.error('API error:', {
    method: req.method,
    path: req.path,
    message: error.message,
  });

  const status = error.status || error.statusCode || 500;

  return res.status(
    status >= 400 && status < 500 ? status : 500
  ).json({
    success: false,
    message:
      status >= 400 && status < 500
        ? error.message
        : 'Internal server error.',
  });
}

module.exports = {
  notFoundHandler,
  errorHandler,
};
