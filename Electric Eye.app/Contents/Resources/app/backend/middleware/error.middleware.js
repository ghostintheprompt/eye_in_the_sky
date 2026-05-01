/**
 * Global error handling middleware
 */
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';

  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

/**
 * 404 Not Found handler
 */
const notFoundHandler = (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.path
  });
};

module.exports = { errorHandler, notFoundHandler };
