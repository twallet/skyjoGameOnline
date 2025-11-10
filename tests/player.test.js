import { Game } from "../model/game.js";
import { Hand } from "../model/hand.js";
import { Player } from "../model/player.js";

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
});
