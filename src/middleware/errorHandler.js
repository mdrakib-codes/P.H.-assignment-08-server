function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    return next(error);
  }

  console.error(error);

  const errorStatus = error.statusCode || error.status;
  const statusCode = Number.isInteger(errorStatus) && errorStatus >= 400 && errorStatus <= 599
    ? errorStatus
    : 500;
  const message = statusCode >= 500
    ? "Internal server error"
    : error.message || "Request failed";

  res.status(statusCode).json({ message });
}

module.exports = errorHandler;