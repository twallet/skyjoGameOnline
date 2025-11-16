// Express middleware factory that logs and gracefully responds to errors.
export function createErrorHandler(logger) {
  return (error, req, res, next) => {
    // Emit structured error details whenever a logger is available.
    if (logger?.error) {
      logger.error(
        `Unhandled error on ${req.method} ${req.originalUrl}`,
        error
      );
    }
    // Delegate to default Express handler if response already started.
    if (res.headersSent) {
      return next(error);
    }
    // Default to generic 500 payload to avoid leaking internals.
    res.status(500).json({ error: "Internal server error" });
  };
}
