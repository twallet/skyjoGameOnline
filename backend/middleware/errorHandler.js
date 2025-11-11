export function createErrorHandler(logger) {
  return (error, req, res, next) => {
    if (logger?.error) {
      logger.error(
        `Unhandled error on ${req.method} ${req.originalUrl}`,
        error
      );
    }
    if (res.headersSent) {
      return next(error);
    }
    res.status(500).json({ error: "Internal server error" });
  };
}

