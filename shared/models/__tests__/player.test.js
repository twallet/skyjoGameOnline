import { Game } from "../game.js";
import { Hand } from "../hand.js";
import { Player } from "../player.js";

const buildSampleGame = () => {
  const values = [-2, -1, 0, 1, 2, 3, 4, 5, 10];
  const images = values.map((_, index) => `images/sample-theme-${index}.jpg`);

  return new Game(
    "Skyjo",
    values,
    [5, 5, 10, 10, 10, 10, 10, 10, 2],
    images,
    "images/back.jpg",
    3,
    4,
    2,
    8
  );
};

describe("Player", () => {
  test("stores a trimmed name and creates a fresh hand by default", () => {
    const game = buildSampleGame();
    const player = new Player("  Alice  ", game);

    expect(player.name).toBe("Alice");
    expect(player.color).toBeNull();
    expect(player.hand).toBeInstanceOf(Hand);
    expect(player.hand.size).toBe(0);
    expect(player.hand.lines).toBe(game.lines);
  });

  test.each([null, undefined, 123, {}, [], () => {}])(
    "rejects non-string name value %p",
    (badName) => {
      const game = buildSampleGame();
      expect(() => new Player(badName, game)).toThrow(
        "Player name must be a string"
      );
    }
  );

  test.each(["", "   "])("rejects empty name value %p", (badName) => {
    const game = buildSampleGame();
    expect(() => new Player(badName, game)).toThrow(
      "Player name must not be empty"
    );
  });

  test("rejects missing or invalid game definitions", () => {
    expect(() => new Player("Alice", null)).toThrow(
      "Player requires a game definition object"
    );
    expect(() => new Player("Alice", {})).toThrow(
      "Player requires the game to expose lines"
    );
  });

  test("stores a provided color when supplied", () => {
    const game = buildSampleGame();
    const player = new Player("Dana", game, "#ffeeaa");

    expect(player.color).toBe("#ffeeaa");
  });

  test("rejects invalid color values", () => {
    const game = buildSampleGame();

    expect(() => new Player("Eli", game, "   ")).toThrow(
      "Player color must not be empty"
    );
    expect(() => new Player("Eli", game, 123)).toThrow(
      "Player color must be a string"
    );
  });

  test("accepts null color explicitly", () => {
    const game = buildSampleGame();
    const player = new Player("Frank", game, null);

    expect(player.color).toBeNull();
  });

  test("accepts undefined color", () => {
    const game = buildSampleGame();
    const player = new Player("Grace", game, undefined);

    expect(player.color).toBeNull();
  });

  test.each([
    ["string", "not an object", "Player requires a game definition object"],
    ["number", 123, "Player requires a game definition object"],
    ["array", [], "Player requires the game to expose lines"],
    ["function", () => {}, "Player requires a game definition object"],
    ["undefined", undefined, "Player requires a game definition object"],
  ])(
    "rejects invalid game definition (%s)",
    (_label, badGame, expectedMessage) => {
      expect(() => new Player("Alice", badGame)).toThrow(expectedMessage);
    }
  );

  test("rejects game with missing lines property", () => {
    const gameWithoutLines = {
      name: "Test",
      values: [1, 2],
    };

    expect(() => new Player("Alice", gameWithoutLines)).toThrow(
      "Player requires the game to expose lines"
    );
  });

  test("rejects game with invalid lines property", () => {
    const gameWithBadLines = {
      name: "Test",
      values: [1, 2],
      lines: "not a number",
    };

    expect(() => new Player("Alice", gameWithBadLines)).toThrow(
      "Player requires the game to expose lines"
    );
  });

  test("rejects game with non-positive integer lines", () => {
    const gameWithBadLines = {
      name: "Test",
      values: [1, 2],
      lines: 0,
    };

    expect(() => new Player("Alice", gameWithBadLines)).toThrow(
      "Player requires the game to expose lines"
    );
  });

  test("hand getter returns the player's hand instance", () => {
    const game = buildSampleGame();
    const player = new Player("Heidi", game);

    expect(player.hand).toBeInstanceOf(Hand);
    expect(player.hand.lines).toBe(game.lines);
  });
});
