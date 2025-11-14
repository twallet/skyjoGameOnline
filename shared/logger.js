const NOOP = () => {};

export const noopLogger = Object.freeze({
  info: NOOP,
  warn: NOOP,
  error: NOOP,
});

/**
 * Normalize an arbitrary logger-like object into one that exposes info/warn/error.
 * @param {Partial<Record<"info" | "warn" | "error", (...args: unknown[]) => void>> | null | undefined} logger
 * @returns {{ info: (...args: unknown[]) => void, warn: (...args: unknown[]) => void, error: (...args: unknown[]) => void }}
 */
export function resolveLogger(logger) {
  if (!logger) {
    return noopLogger;
  }

  const info =
    typeof logger.info === "function"
      ? (...args) => logger.info(...args)
      : NOOP;
  const warn =
    typeof logger.warn === "function"
      ? (...args) => logger.warn(...args)
      : NOOP;
  const error =
    typeof logger.error === "function"
      ? (...args) => logger.error(...args)
      : NOOP;

  if (info === NOOP && warn === NOOP && error === NOOP) {
    return noopLogger;
  }

  return { info, warn, error };
}

export const consoleLogger =
  typeof console !== "undefined" ? resolveLogger(console) : noopLogger;
