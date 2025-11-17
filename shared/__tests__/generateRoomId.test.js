import { jest } from "@jest/globals";

import { generateRoomId, ROOM_ID_ALPHABET } from "../generateRoomId.js";

/**
 * Test suite for the generateRoomId function.
 * Verifies room identifier generation, length customization, and input validation.
 */
describe("generateRoomId", () => {
  /**
   * Restore all mocks after each test to ensure test isolation.
   */
  afterEach(() => {
    jest.restoreAllMocks();
  });

  /**
   * Verifies that generateRoomId creates identifiers with the default length of 6 characters.
   * Uses a controlled sequence of random values to ensure deterministic test results.
   */
  it("creates room identifiers with the default length", () => {
    const sequence = [0.01, 0.2, 0.4, 0.6, 0.8, 0.99];
    let call = 0;
    jest.spyOn(Math, "random").mockImplementation(() => sequence[call++]);

    const id = generateRoomId();
    const expected = sequence
      .map(
        (value) => ROOM_ID_ALPHABET[Math.floor(value * ROOM_ID_ALPHABET.length)]
      )
      .join("");

    expect(id).toHaveLength(6);
    expect(id).toBe(expected);
  });

  /**
   * Verifies that generateRoomId supports custom length parameters.
   * Ensures all generated characters are valid alphabet characters.
   */
  it("supports custom lengths", () => {
    jest.spyOn(Math, "random").mockReturnValue(0.5);

    const id = generateRoomId(10);

    expect(id).toHaveLength(10);
    for (const char of id) {
      expect(ROOM_ID_ALPHABET).toContain(char);
    }
  });

  /**
   * Verifies that generateRoomId rejects non-positive length values.
   * Tests zero and negative values to ensure proper error handling.
   */
  it("rejects non-positive lengths", () => {
    expect(() => generateRoomId(0)).toThrow(TypeError);
    expect(() => generateRoomId(-3)).toThrow("positive integer");
  });

  /**
   * Verifies that generateRoomId rejects non-integer length values.
   * Tests decimal numbers and NaN to ensure type validation works correctly.
   */
  it("rejects non-integer lengths", () => {
    expect(() => generateRoomId(3.5)).toThrow(TypeError);
    expect(() => generateRoomId(NaN)).toThrow(TypeError);
  });
});
