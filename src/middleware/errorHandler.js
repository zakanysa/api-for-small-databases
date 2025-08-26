const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  console.error('Error:', err);

  if (err.code === 'ENOENT') {
    error.message = 'File not found';
    error.statusCode = 404;
  }

  if (err.code === 'ECONNREFUSED') {
    error.message = 'Database connection refused';
    error.statusCode = 503;
  }

  if (err.code === 'ER_ACCESS_DENIED_ERROR' || err.code === 28000) {
    error.message = 'Database access denied';
    error.statusCode = 401;
  }

  if (err.code === 'ER_BAD_DB_ERROR') {
    error.message = 'Database not found';
    error.statusCode = 404;
  }

  if (err.name === 'ValidationError') {
    error.message = 'Validation Error';
    error.statusCode = 400;
  }

  if (err.name === 'CastError') {
    error.message = 'Invalid data format';
    error.statusCode = 400;
  }

  if (err.code === 'LIMIT_FILE_SIZE') {
    error.message = 'File too large';
    error.statusCode = 413;
  }

  if (err.message && err.message.includes('SQLITE_ERROR')) {
    error.message = 'SQLite database error';
    error.statusCode = 500;
  }

  const response = {
    success: false,
    error: {
      message: error.message || 'Server Error',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  };

  res.status(error.statusCode || 500).json(response);
};

const notFound = (req, res, next) => {
  const error = new Error(`Endpoint ${req.originalUrl} not found`);
  error.statusCode = 404;
  next(error);
};

module.exports = { errorHandler, notFound };