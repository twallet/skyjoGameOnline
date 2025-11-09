import { Card } from "../model/card.js";

describe("Card", () => {
  const skyjo = { name: "Skyjo", values: [-2, -1, 0, 1, 2, 3, 4, 5, 10] };

  test("accepts valid value within the game definition", () => {
    const card = new Card(0, skyjo);
    expect(card.value).toBe(0);
  });

  test("throws when value is null or undefined", () => {
    expect(() => new Card(null, skyjo)).toThrow(
      "Card value must not be null or undefined"
    );
    expect(() => new Card(undefined, skyjo)).toThrow(
      "Card value must not be null or undefined"
    );
  });

  test("throws when the game definition is missing", () => {
    expect(() => new Card(0)).toThrow("Card requires a game definition");
  });

  test("throws when the game definition lacks a values array", () => {
    const badGame = { name: "Skyjo" };
    expect(() => new Card(0, badGame)).toThrow(
      "Game definition must provide a values array"
    );
  });

  test("throws when the value does not exist in the game", () => {
    expect(() => new Card(99, skyjo)).toThrow(
      "Card value not available in the game: Skyjo"
    );
  });

  test("freezes the instance to keep value immutable", () => {
    const card = new Card(10, skyjo);
    expect(Object.isFrozen(card)).toBe(true);
    expect(() => {
      card.value = 5;
    }).toThrow();
    expect(card.value).toBe(10);
  });
});
