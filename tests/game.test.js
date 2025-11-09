import { Game } from "../model/game.js";

describe("Game", () => {
  test("stores validated data and protects internal arrays", () => {
    const possibleValues = [-2, -1, 0, 1, 2, 3, 4, 5, 10];
    const quantities = [5, 5, 10, 10, 10, 10, 10, 10, 2];

    const game = new Game("  Skyjo  ", possibleValues, quantities, 3);

    expect(game.name).toBe("Skyjo");
    expect(game.values).toEqual(possibleValues);
    expect(game.quantities).toEqual(quantities);
    expect(game.handsize).toBe(3);

    const valuesSnapshot = game.values;
    valuesSnapshot.push(99);

    expect(game.values).toEqual(possibleValues);
    expect(valuesSnapshot).not.toEqual(game.values);
  });

  test.each([null, undefined, 123, {}, [], () => {}])(
    "rejects non-string name %p",
    (badName) => {
      expect(() => new Game(badName, [1], [1], 1)).toThrow(
        "Game name must be a string"
      );
    }
  );

  test.each(["", "   "])("rejects empty name %p", (badName) => {
    expect(() => new Game(badName, [1], [1], 1)).toThrow(
      "Game name must not be empty"
    );
  });

  test.each([
    null,
    undefined,
    "not array",
    [],
    [1, "two", 3],
    [Infinity],
    [NaN],
  ])("rejects invalid values %p", (badValues) => {
    expect(() => new Game("Skyjo", badValues, [1], 1)).toThrow(
      Array.isArray(badValues) && badValues.length > 0
        ? "Game values must be finite numbers"
        : "Game values must be a non-empty array of numbers"
    );
  });

  test("rejects quantities with the wrong length", () => {
    expect(() => new Game("Skyjo", [1, 2], [2], 1)).toThrow(
      "Game quantities must match the length of values"
    );
  });

  test.each([null, undefined, "not array", [1.5, 2], [-1, 2], [1, {}]])(
    "rejects invalid quantities %p",
    (badQuantities) => {
      expect(() => new Game("Skyjo", [1, 2], badQuantities, 1)).toThrow(
        Array.isArray(badQuantities) && badQuantities.length === 2
          ? "Game quantities must be non-negative integers"
          : "Game quantities must match the length of values"
      );
    }
  );

  test.each([0, -1, 1.5, "3", null, undefined])(
    "rejects invalid handsize %p",
    (badHandsize) => {
      expect(() => new Game("Skyjo", [1], [1], badHandsize)).toThrow(
        "Game handsize must be a positive integer"
      );
    }
  );
});
