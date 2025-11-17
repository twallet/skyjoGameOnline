import "@testing-library/jest-dom";

// Polyfill for fetch API in Jest/jsdom environment
// Node.js 18+ includes fetch, but Jest/jsdom may not expose it globally
if (typeof globalThis.fetch === "undefined") {
  // Provide a basic fetch implementation that can be mocked in tests
  // This prevents "fetch is not defined" errors when RoomApi methods are called
  globalThis.fetch = async (url, options) => {
    // This will be mocked in individual tests via RoomApi mocks
    // If it's called without a mock, throw a helpful error
    throw new Error(
      `fetch called without mock: ${url}. Make sure to mock RoomApi methods in your tests.`
    );
  };
}

// Suppress console.info messages during tests to reduce noise
// Tests can still access console.info if needed by using jest.spyOn
const originalConsoleInfo = console.info;
console.info = () => {
  // Silently ignore console.info calls during tests
};
