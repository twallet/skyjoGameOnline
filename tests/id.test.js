import { jest } from "@jest/globals";

import { generateRoomId } from "../utils/id.js";

const ROOM_ID_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

describe("generateRoomId", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

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

  it("supports custom lengths", () => {
    jest.spyOn(Math, "random").mockReturnValue(0.5);

    const id = generateRoomId(10);

    expect(id).toHaveLength(10);
    for (const char of id) {
      expect(ROOM_ID_ALPHABET).toContain(char);
    }
  });

  it("rejects non-positive lengths", () => {
    expect(() => generateRoomId(0)).toThrow(TypeError);
    expect(() => generateRoomId(-3)).toThrow("positive integer");
  });

  it("rejects non-integer lengths", () => {
    expect(() => generateRoomId(3.5)).toThrow(TypeError);
    expect(() => generateRoomId(NaN)).toThrow(TypeError);
  });
});
