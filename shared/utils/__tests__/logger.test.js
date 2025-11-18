import { jest } from "@jest/globals";

import { noopLogger, resolveLogger, consoleLogger } from "../logger.js";

/**
 * Test suite for the logger utility module.
 * Verifies logger normalization, noop logger behavior, and console logger resolution.
 */
describe("logger", () => {
  /**
   * Verifies that noopLogger is frozen and cannot be modified.
   */
  it("noopLogger is frozen", () => {
    expect(Object.isFrozen(noopLogger)).toBe(true);
  });

  /**
   * Verifies that noopLogger exposes info, warn, and error methods.
   */
  it("noopLogger exposes required methods", () => {
    expect(typeof noopLogger.info).toBe("function");
    expect(typeof noopLogger.warn).toBe("function");
    expect(typeof noopLogger.error).toBe("function");
  });

  /**
   * Verifies that noopLogger methods do nothing and do not throw errors.
   */
  it("noopLogger methods are no-ops", () => {
    expect(() => {
      noopLogger.info("test");
      noopLogger.warn("test");
      noopLogger.error("test");
      noopLogger.info("test", 1, 2, 3);
    }).not.toThrow();
  });

  /**
   * Verifies that resolveLogger returns noopLogger for null input.
   */
  it("resolveLogger returns noopLogger for null", () => {
    const result = resolveLogger(null);
    expect(result).toBe(noopLogger);
  });

  /**
   * Verifies that resolveLogger returns noopLogger for undefined input.
   */
  it("resolveLogger returns noopLogger for undefined", () => {
    const result = resolveLogger(undefined);
    expect(result).toBe(noopLogger);
  });

  /**
   * Verifies that resolveLogger wraps a complete logger object correctly.
   */
  it("resolveLogger wraps complete logger object", () => {
    const mockInfo = jest.fn();
    const mockWarn = jest.fn();
    const mockError = jest.fn();

    const logger = {
      info: mockInfo,
      warn: mockWarn,
      error: mockError,
    };

    const resolved = resolveLogger(logger);

    resolved.info("test1", "arg2");
    resolved.warn("test2");
    resolved.error("test3", "arg4", "arg5");

    expect(mockInfo).toHaveBeenCalledWith("test1", "arg2");
    expect(mockWarn).toHaveBeenCalledWith("test2");
    expect(mockError).toHaveBeenCalledWith("test3", "arg4", "arg5");
  });

  /**
   * Verifies that resolveLogger handles partial logger objects with missing methods.
   */
  it("resolveLogger handles partial logger with only info", () => {
    const mockInfo = jest.fn();
    const logger = { info: mockInfo };

    const resolved = resolveLogger(logger);

    resolved.info("test");
    resolved.warn("test");
    resolved.error("test");

    expect(mockInfo).toHaveBeenCalledWith("test");
    expect(() => {
      resolved.warn("test");
      resolved.error("test");
    }).not.toThrow();
  });

  /**
   * Verifies that resolveLogger handles partial logger objects with only warn.
   */
  it("resolveLogger handles partial logger with only warn", () => {
    const mockWarn = jest.fn();
    const logger = { warn: mockWarn };

    const resolved = resolveLogger(logger);

    resolved.info("test");
    resolved.warn("test");
    resolved.error("test");

    expect(mockWarn).toHaveBeenCalledWith("test");
    expect(() => {
      resolved.info("test");
      resolved.error("test");
    }).not.toThrow();
  });

  /**
   * Verifies that resolveLogger handles partial logger objects with only error.
   */
  it("resolveLogger handles partial logger with only error", () => {
    const mockError = jest.fn();
    const logger = { error: mockError };

    const resolved = resolveLogger(logger);

    resolved.info("test");
    resolved.warn("test");
    resolved.error("test");

    expect(mockError).toHaveBeenCalledWith("test");
    expect(() => {
      resolved.info("test");
      resolved.warn("test");
    }).not.toThrow();
  });

  /**
   * Verifies that resolveLogger returns noopLogger when all methods are invalid.
   */
  it("resolveLogger returns noopLogger when all methods are invalid", () => {
    const logger = {
      info: "not a function",
      warn: 123,
      error: null,
    };

    const resolved = resolveLogger(logger);
    expect(resolved).toBe(noopLogger);
  });

  /**
   * Verifies that resolveLogger handles non-function methods correctly.
   */
  it("resolveLogger handles non-function methods", () => {
    const mockInfo = jest.fn();
    const logger = {
      info: mockInfo,
      warn: "not a function",
      error: undefined,
    };

    const resolved = resolveLogger(logger);

    resolved.info("test");
    resolved.warn("test");
    resolved.error("test");

    expect(mockInfo).toHaveBeenCalledWith("test");
    expect(() => {
      resolved.warn("test");
      resolved.error("test");
    }).not.toThrow();
  });

  /**
   * Verifies that resolveLogger handles empty object input.
   */
  it("resolveLogger handles empty object", () => {
    const resolved = resolveLogger({});
    expect(resolved).toBe(noopLogger);
  });

  /**
   * Verifies that consoleLogger is resolved correctly when console is available.
   */
  it("consoleLogger is resolved from console when available", () => {
    if (typeof console !== "undefined") {
      expect(consoleLogger).not.toBe(noopLogger);
      expect(typeof consoleLogger.info).toBe("function");
      expect(typeof consoleLogger.warn).toBe("function");
      expect(typeof consoleLogger.error).toBe("function");
    }
  });

  /**
   * Verifies that resolved logger methods preserve argument forwarding.
   */
  it("resolveLogger preserves all arguments", () => {
    const mockInfo = jest.fn();
    const logger = { info: mockInfo };

    const resolved = resolveLogger(logger);
    resolved.info("arg1", "arg2", 3, { key: "value" }, [1, 2, 3]);

    expect(mockInfo).toHaveBeenCalledWith(
      "arg1",
      "arg2",
      3,
      { key: "value" },
      [1, 2, 3]
    );
  });
});
