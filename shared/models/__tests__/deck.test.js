import { Deck } from "../deck.js";
import { Game } from "../game.js";
import { Card } from "../card.js";

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

describe("Deck", () => {
  test("generateDeck creates the expected amount of cards", () => {
    const game = buildSampleGame();
    const deck = Deck.generateDeck(game);
    const expectedCardCount = game.quantities.reduce(
      (total, quantity) => total + quantity,
      0
    );

    expect(deck.cardsDeck).toHaveLength(expectedCardCount);

    const tally = deck.cardsDeck.reduce((map, card) => {
      card.visible = true;
      map.set(card.value, (map.get(card.value) ?? 0) + 1);
      return map;
    }, new Map());

    game.values.forEach((value, index) => {
      expect(tally.get(value)).toBe(game.quantities[index]);
    });
  });

  test("cardsDeck provides a defensive copy", () => {
    const game = buildSampleGame();
    const deck = Deck.generateDeck(game);
    const snapshot = deck.cardsDeck;

    snapshot.pop();

    expect(deck.cardsDeck).toHaveLength(
      game.quantities.reduce((total, quantity) => total + quantity, 0)
    );
  });

  test("add rejects non-card inputs", () => {
    const deck = new Deck();

    expect(() => deck.add({})).toThrow("Deck only accepts Card instances");
  });

  test("dealNextCard rejects dealing from an empty deck", () => {
    const deck = new Deck();

    expect(() => deck.dealNextCard()).toThrow("Cannot deal from an empty deck");
  });

  test.each([
    { game: null, message: "Deck requires a game definition object" },
    { game: {}, message: "Deck requires the game to expose card values" },
    {
      game: { values: [], quantities: [] },
      message: "Deck requires the game to expose card values",
    },
    {
      game: { values: [0], quantities: [] },
      message: "Deck requires card quantities matching the game values",
    },
    {
      game: { values: [Infinity], quantities: [1] },
      message: "Deck requires the game values to be finite numbers",
    },
    {
      game: { values: [0], quantities: [-1] },
      message: "Deck requires the game quantities to be non-negative integers",
    },
  ])(
    "generateDeck validates the supplied game definition %#",
    ({ game, message }) => {
      expect(() => Deck.generateDeck(game)).toThrow(message);
    }
  );

  test("size returns zero for empty deck", () => {
    const deck = new Deck();
    expect(deck.size()).toBe(0);
  });

  test("size returns correct count after adding cards", () => {
    const game = buildSampleGame();
    const deck = Deck.generateDeck(game);
    const expectedSize = game.quantities.reduce(
      (total, quantity) => total + quantity,
      0
    );

    expect(deck.size()).toBe(expectedSize);
  });

  test("dealNextCard removes cards from deck and reduces size", () => {
    const game = buildSampleGame();
    const deck = Deck.generateDeck(game);
    const initialSize = deck.size();

    const card = deck.dealNextCard();

    expect(card).toBeInstanceOf(Card);
    expect(deck.size()).toBe(initialSize - 1);
  });

  test("dealNextCard deals cards in reverse order (LIFO)", () => {
    const game = buildSampleGame();
    const deck = Deck.generateDeck(game);
    const cardsBefore = deck.cardsDeck;
    const lastCardBefore = cardsBefore[cardsBefore.length - 1];

    const dealtCard = deck.dealNextCard();

    lastCardBefore.visible = true;
    dealtCard.visible = true;
    expect(dealtCard.value).toBe(lastCardBefore.value);
  });

  test("showFirstCard makes the first card visible", () => {
    const game = buildSampleGame();
    const deck = Deck.generateDeck(game);
    const firstCard = deck.cardsDeck[0];

    expect(firstCard.value).toBe("X");

    deck.showFirstCard();

    expect(firstCard.value).not.toBe("X");
    expect(typeof firstCard.value).toBe("number");
  });

  test("showFirstCard does nothing on empty deck", () => {
    const deck = new Deck();

    expect(() => deck.showFirstCard()).not.toThrow();
    expect(deck.size()).toBe(0);
  });

  test("add accepts multiple cards sequentially", () => {
    const deck = new Deck();
    const game = buildSampleGame();
    const card1 = new Card(game.values[0], game);
    const card2 = new Card(game.values[1], game);

    deck.add(card1);
    deck.add(card2);

    expect(deck.size()).toBe(2);
    expect(deck.cardsDeck).toHaveLength(2);
  });

  test("getCardsForShuffling returns reference to internal cards array", () => {
    const game = buildSampleGame();
    const deck = Deck.generateDeck(game);
    const cardsRef = deck.getCardsForShuffling();

    expect(Array.isArray(cardsRef)).toBe(true);
    expect(cardsRef.length).toBeGreaterThan(0);

    const originalLength = cardsRef.length;
    cardsRef.pop();

    expect(deck.size()).toBe(originalLength - 1);
  });
});
