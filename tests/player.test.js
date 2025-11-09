import { Game } from "../model/game.js";
import { Hand } from "../model/hand.js";
import { Player } from "../model/player.js";

const buildSampleGame = () =>
  new Game(
    "Skyjo",
    [-2, -1, 0, 1, 2, 3, 4, 5, 10],
    [5, 5, 10, 10, 10, 10, 10, 10, 2],
    12,
    4
  );

describe("Player", () => {
  test("stores a trimmed name and creates a fresh hand by default", () => {
    const game = buildSampleGame();
    const player = new Player("  Alice  ", game);

    expect(player.name).toBe("Alice");
    expect(player.hand).toBeInstanceOf(Hand);
    expect(player.hand.size).toBe(0);
    expect(player.hand.lines).toBe(game.lines);
    expect(player.game).toBe(game);
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

  test("allows injecting an existing hand instance", () => {
    const game = buildSampleGame();
    const existingHand = new Hand(game.lines);
    const player = new Player("Bob", game, existingHand);

    expect(player.hand).toBe(existingHand);
  });

  test("rejects injected hand that is not a Hand instance", () => {
    const game = buildSampleGame();
    expect(() => new Player("Carol", game, {})).toThrow(
      "Player hand must be a Hand instance"
    );
  });
});
