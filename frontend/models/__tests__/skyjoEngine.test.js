import { jest } from "@jest/globals";
import { Game } from "../../../shared/models/game.js";
import { Player } from "../../../shared/models/player.js";
import { Card } from "../../../shared/models/card.js";
import {
  SkyjoEngine,
  SkyjoPhases,
} from "../../../shared/models/skyjoEngine.js";

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

  function advanceToMainPhase(engine, playerCount) {
    for (let index = 0; index < playerCount; index++) {
      engine.revealInitialCard(index, 0);
    }
    for (let index = 0; index < playerCount; index++) {
      engine.revealInitialCard(index, 1);
    }
  }

  afterEach(() => {
    jest.useRealTimers();
  });

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

  test("active player can draw from deck and replace a card", () => {
    const players = [
      buildPlayer("Alice", [9, 6, 3, 4], game),
      buildPlayer("Bob", [4, 5, 8, 2], game),
    ];
    const deck = new StubDeck([new Card(7, game), new Card(5, game)]);
    const dealer = { deck, players };

    const engine = new SkyjoEngine(game, dealer, players);
    advanceToMainPhase(engine, players.length);

    const drawResult = engine.drawFromDeck(0);
    expect(drawResult.card.value).toBe(7);

    const actionResult = engine.replaceWithDrawnCard(0, 2);
    expect(actionResult.discarded.value).toBe(3);
    expect(players[0].hand.cards()[2]).toBe(7);
    expect(engine.discardTopCard().value).toBe(3);
    expect(engine.activePlayerIndex).toBe(1);
    expect(engine.buildStateSnapshot().drawnCard).toBeNull();
  });

  test("active player can draw from discard, discard it and reveal a hidden card", () => {
    const players = [
      buildPlayer("Alice", [9, 6, 3, 4], game),
      buildPlayer("Bob", [4, 5, 8, 2], game),
    ];
    const deck = new StubDeck([new Card(8, game), new Card(5, game)]);
    const dealer = { deck, players };

    const engine = new SkyjoEngine(game, dealer, players);
    advanceToMainPhase(engine, players.length);

    const drawResult = engine.drawFromDiscard(0);
    expect(drawResult.card.value).toBe(5);

    const actionResult = engine.discardDrawnCardAndReveal(0, 2);
    expect(actionResult.revealed.value).toBe(3);
    expect(players[0].hand.isCardVisible(2)).toBe(true);
    expect(engine.discardTopCard().value).toBe(5);
    expect(engine.activePlayerIndex).toBe(1);
  });

  test("column removal delay keeps turn with current player until removal resolves", () => {
    jest.useFakeTimers();
    const players = [
      buildPlayer("Alice", [1, 3, 1, 4], game),
      buildPlayer("Bob", [0, 0, 0, 0], game),
    ];
    const deck = new StubDeck([new Card(1, game), new Card(9, game)]);
    const dealer = { deck, players };

    const engine = new SkyjoEngine(game, dealer, players);

    engine.revealInitialCard(0, 0);
    engine.revealInitialCard(1, 0);
    engine.revealInitialCard(0, 1);
    engine.revealInitialCard(1, 1);

    expect(engine.phase).toBe(SkyjoPhases.MAIN_PLAY);
    expect(engine.activePlayerIndex).toBe(0);

    const drawResult = engine.drawFromDeck(0);
    expect(drawResult.card.value).toBe(1);

    const actionResult = engine.replaceWithDrawnCard(0, 2);

    expect(actionResult.nextPlayerIndex).toBe(1);
    expect(engine.activePlayerIndex).toBe(0);

    let snapshot = engine.buildStateSnapshot();
    expect(snapshot.pendingColumnRemovals).toHaveLength(1);
    expect(players[0].hand.columns).toBe(2);

    jest.advanceTimersByTime(3000);
    jest.runOnlyPendingTimers();

    snapshot = engine.buildStateSnapshot();
    expect(snapshot.pendingColumnRemovals).toHaveLength(0);
    expect(players[0].hand.columns).toBe(1);
    expect(engine.activePlayerIndex).toBe(1);
  });

  test("triggers final round when player reveals their last hidden card", () => {
    const players = [
      buildPlayer("Alice", [9, 8, 3, 4], game),
      buildPlayer("Bob", [1, 2, 7, 8], game),
    ];
    const deck = new StubDeck([
      new Card(11, game),
      new Card(9, game),
      new Card(7, game),
    ]);
    const dealer = { deck, players };

    const engine = new SkyjoEngine(game, dealer, players);
    advanceToMainPhase(engine, players.length);

    players[0].hand.revealCard(2);

    const drawResult = engine.drawFromDeck(0);
    expect(drawResult.card.value).toBe(9);

    const actionResult = engine.discardDrawnCardAndReveal(0, 3);

    expect(actionResult.phase).toBe(SkyjoPhases.FINAL_ROUND);
    expect(engine.phase).toBe(SkyjoPhases.FINAL_ROUND);
    expect(engine.activePlayerIndex).toBe(1);
    expect(actionResult.nextPlayerIndex).toBe(1);

    const snapshot = engine.buildStateSnapshot();
    expect(snapshot.finalRound.inProgress).toBe(true);
    expect(snapshot.finalRound.triggeredBy).toBe("Alice");
    expect(snapshot.finalRound.pendingTurns).toEqual([]);
  });

  test("prevents drawing more than once per turn", () => {
    const players = [
      buildPlayer("Alice", [9, 6, 3, 4], game),
      buildPlayer("Bob", [4, 5, 8, 2], game),
    ];
    const deck = new StubDeck([new Card(7, game), new Card(5, game)]);
    const dealer = { deck, players };

    const engine = new SkyjoEngine(game, dealer, players);
    advanceToMainPhase(engine, players.length);

    engine.drawFromDeck(0);

    expect(() => engine.drawFromDeck(0)).toThrow(
      "Player must resolve the previously drawn card first"
    );
  });
});
