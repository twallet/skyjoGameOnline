import { jest } from "@jest/globals";
import { act } from "react";

/**
 * Await the resolution of all pending microtasks. Useful when code under test
 * queues Promise callbacks that need to settle before assertions run.
 *
 * @returns {Promise<void>}
 */
export async function flushPromises() {
  await act(async () => {
    await new Promise((resolve) => {
      setTimeout(resolve, 0);
    });
  });
}

/**
 * Create a stub Jest logger with noop implementations for common levels.
 *
 * @returns {{ info: jest.Mock, warn: jest.Mock, error: jest.Mock }}
 */
export function createLoggerMock() {
  return {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
}
