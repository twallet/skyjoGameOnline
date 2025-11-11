import { Game } from "../game.js";
import { Player } from "../player.js";
import { Card } from "../card.js";
import { SkyjoEngine, SkyjoPhases } from "../skyjoEngine.js";

class StubDeck {
  #cards;

  constructor(cards) {
    this.#cards = [...cards];
  }

  size() {
    return this.#cards.length;
  }

  dealNextCard() {
    if (this.#cards.length === 0) {
      throw new Error("Stub deck is empty");
    }

    return this.#cards.pop();
  }
}

const buildGame = () =>
  new Game(
    "Test Skyjo",
    [-2, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    [5, 10, 15, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10],
    [
      "./assets/images/minus2.jpg",
      "./assets/images/minus1.jpg",
      "./assets/images/0.jpg",
      "./assets/images/1.jpg",
      "./assets/images/2.jpg",
      "./assets/images/3.jpg",
      "./assets/images/4.jpg",
      "./assets/images/5.jpg",
      "./assets/images/6.jpg",
      "./assets/images/7.jpg",
      "./assets/images/8.jpg",
      "./assets/images/9.jpg",
      "./assets/images/10.jpg",
      "./assets/images/11.jpg",
      "./assets/images/12.jpg",
    ],
    "./assets/images/back.jpg",
    4,
    2,
    2,
    8
  );

function buildPlayer(name, cardValues, game) {
  const player = new Player(name, game);
  cardValues.forEach((value) => {
    player.hand.add(new Card(value, game));
  });
  return player;
}

describe("SkyjoEngine", () => {
  const game = buildGame();

  test("initializes discard pile with a visible card", () => {
    const players = [
      buildPlayer("Alice", [2, 8, 3, 5], game),
      buildPlayer("Bob", [1, 4, 6, 7], game),
    ];
    const deck = new StubDeck([new Card(5, game), new Card(9, game)]);
    const dealer = { deck, players }; // minimal shape required by engine

    const engine = new SkyjoEngine(game, dealer, players);

    expect(engine.phase).toBe(SkyjoPhases.INITIAL_FLIP);
    expect(engine.discardSize).toBe(1);

    const deckSnapshot = engine.buildDeckSnapshot();
    expect(deckSnapshot.size).toBe(1);
    expect(deckSnapshot.topCard).toEqual(
      expect.objectContaining({
        visible: true,
        image: expect.any(String),
      })
    );
  });

  test("resolves starting player after initial flip", () => {
    const players = [
      buildPlayer("Alice", [9, 6, 3, 4], game), // sum of first two = 15
      buildPlayer("Bob", [4, 5, 8, 2], game), // sum of first two = 9
      buildPlayer("Carol", [3, 7, 1, 6], game), // sum = 10
    ];
    const deck = new StubDeck([new Card(2, game), new Card(7, game)]);
    const dealer = { deck, players };

    const engine = new SkyjoEngine(game, dealer, players);

    // Each player reveals two cards in turn
    engine.revealInitialCard(0, 0);
    engine.revealInitialCard(1, 0);
    engine.revealInitialCard(2, 0);
    engine.revealInitialCard(0, 1);
    engine.revealInitialCard(1, 1);
    const result = engine.revealInitialCard(2, 1);

    expect(result.phase).toBe(SkyjoPhases.MAIN_PLAY);
    expect(engine.phase).toBe(SkyjoPhases.MAIN_PLAY);
    expect(engine.activePlayerIndex).toBe(0);

    const state = engine.buildStateSnapshot();
    expect(state.initialFlip.resolved).toBe(true);
    expect(state.activePlayer).toEqual(
      expect.objectContaining({ name: "Alice" })
    );
  });
});
