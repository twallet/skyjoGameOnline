import { jest } from "@jest/globals";
import { Dealer } from "../model/dealer.js";
import { Game } from "../model/game.js";
import { Player } from "../model/player.js";

const buildSampleGame = () => {
  const values = [-2, -1, 0, 1, 2, 3, 4, 5, 10];
  const images = values.map(
    (_, index) => `images/sample-theme-${index}.jpg`
  );

  return new Game(
    "Skyjo",
    values,
    [5, 5, 10, 10, 10, 10, 10, 10, 2],
    images,
    "images/back.jpg",
    3,
    1,
    2,
    8
  );
};

describe("Dealer", () => {
  beforeEach(() => {
    jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("constructs with validated game and players", () => {
    const game = buildSampleGame();
    const players = [new Player("Alice", game), new Player("Bob", game)];

    const dealer = new Dealer(game, players);

    expect(dealer.handSize).toBe(game.handsize);
    expect(dealer.players).toHaveLength(2);
    expect(dealer.players[0]).toBe(players[0]);
    expect(dealer.deck.cardsDeck).toHaveLength(
      game.quantities.reduce((total, quantity) => total + quantity, 0)
    );
  });

  test("players getter returns a defensive copy", () => {
    const game = buildSampleGame();
    const dealer = new Dealer(game, [new Player("Alice", game)]);

    const snapshot = dealer.players;
    snapshot.pop();

    expect(dealer.players).toHaveLength(1);
  });

  test("deal distributes the expected amount of cards", () => {
    const game = buildSampleGame();
    const players = [new Player("Alice", game), new Player("Bob", game)];
    const dealer = new Dealer(game, players);

    dealer.deal();

    players.forEach((player) => {
      expect(player.hand.size).toBe(game.handsize);
    });
  });

  test("shuffle delegates to the deck and logs the outcome", () => {
    const game = buildSampleGame();
    const dealer = new Dealer(game, [new Player("Alice", game)]);
    const shuffleSpy = jest.spyOn(dealer.deck, "shuffle");

    dealer.shuffle();

    expect(shuffleSpy).toHaveBeenCalledTimes(1);
    expect(console.log).toHaveBeenCalledWith(
      `Deck of ${dealer.deck.size()} cards shuffled.`
    );
  });

  test("supports games exposing handSize instead of handsize", () => {
    const legacyGame = {
      name: "Legacy",
      values: [0],
      quantities: [4],
      handSize: 1,
      lines: 1,
      imageFor() {
        return "images/legacy-0.jpg";
      },
      backImage: "images/back.jpg",
    };
    const dealer = new Dealer(legacyGame, [new Player("Alice", legacyGame)]);

    expect(dealer.handSize).toBe(1);
  });

  test("rejects an invalid game definition", () => {
    const game = buildSampleGame();
    expect(() => new Dealer(null, [new Player("Alice", game)])).toThrow(
      "Dealer requires a game definition object"
    );
  });

  test("rejects missing players", () => {
    expect(() => new Dealer(buildSampleGame(), [])).toThrow(
      "Dealer requires at least one player"
    );
  });

  test("rejects non-player entries", () => {
    expect(() => new Dealer(buildSampleGame(), [{ name: "Alice" }])).toThrow(
      "Dealer requires every player to be a Player instance"
    );
  });
});
