import { Card } from "../model/card.js";

const buildGame = (values = [5, 10, -2]) => ({
  name: "Sample",
  values,
});

describe("Card", () => {
  test("initializes hidden by default and reveals on visibility", () => {
    const card = new Card(5, buildGame());

    expect(card.value).toBe("X");

    card.visible = true;

    expect(card.value).toBe(5);
  });

  test("rejects non-boolean visibility assignments", () => {
    const card = new Card(5, buildGame());

    expect(() => {
      card.visible = "true";
    }).toThrow("Card visibility must be a boolean");
  });

  test.each([null, undefined])("rejects missing card values %p", (badValue) => {
    expect(() => new Card(badValue, buildGame())).toThrow(
      "Card value must not be null or undefined"
    );
  });

  test("rejects missing game definition", () => {
    expect(() => new Card(5, null)).toThrow("Card requires a game definition");
  });

  test("rejects game definitions without values array", () => {
    expect(() => new Card(5, { name: "Broken" })).toThrow(
      "Game definition must provide a values array"
    );
  });

  test("rejects values not present in the game definition", () => {
    const game = buildGame([1, 2]);

    expect(() => new Card(5, game)).toThrow(
      "Card value not available in the game: Sample"
    );
  });
});
