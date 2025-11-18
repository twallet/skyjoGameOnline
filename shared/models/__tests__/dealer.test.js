import { jest } from "@jest/globals";
import { Dealer } from "../dealer.js";
import { Game } from "../game.js";
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

  test("shuffle randomizes card order", () => {
    const game = buildSampleGame();
    const players = [new Player("Alice", game), new Player("Bob", game)];
    const dealer = new Dealer(game, players);

    const originalOrder = dealer.deck.cardsDeck.map((card) => {
      card.visible = true;
      return card.value;
    });

    dealer.shuffle();

    const shuffledOrder = dealer.deck.cardsDeck.map((card) => {
      card.visible = true;
      return card.value;
    });

    expect(shuffledOrder).toHaveLength(originalOrder.length);
    expect(shuffledOrder.sort()).toEqual(originalOrder.sort());

    let orderChanged = false;
    for (let i = 0; i < 10; i++) {
      dealer.shuffle();
      const newOrder = dealer.deck.cardsDeck.map((card) => {
        card.visible = true;
        return card.value;
      });
      if (JSON.stringify(newOrder) !== JSON.stringify(originalOrder)) {
        orderChanged = true;
        break;
      }
    }
    expect(orderChanged).toBe(true);
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
