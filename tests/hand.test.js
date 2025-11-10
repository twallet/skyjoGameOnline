import { Hand } from "../model/hand.js";
import { Card } from "../model/card.js";

const buildGame = () => {
  const values = [1, 2, 3, 4];
  const images = values.map(
    (_, index) => `images/test-theme-${index}.jpg`
  );

  return {
    name: "Test Game",
    values,
    imageFor(value) {
      const valueIndex = values.indexOf(value);
      if (valueIndex === -1) {
        throw new Error(`No image defined for value ${value}`);
      }

      return images[valueIndex];
    },
    backImage: "images/back.jpg",
  };
};

const buildCard = (value, { visible = false } = {}) => {
  const game = buildGame();
  const card = new Card(value, game);
  if (visible) {
    card.visible = true;
  }
  return card;
};

describe("Hand", () => {
  test("constructs an empty hand with default single line", () => {
    const hand = new Hand();

    expect(hand.size).toBe(0);
    expect(hand.lines).toBe(1);
  });

  test("accepts a custom number of lines", () => {
    const hand = new Hand(3);

    expect(hand.lines).toBe(3);
  });

  test("add stores card instances and increases size", () => {
    const hand = new Hand();
    const firstCard = buildCard(1);
    const secondCard = buildCard(2);

    hand.add(firstCard);
    hand.add(secondCard);

    expect(hand.size).toBe(2);
    expect(hand.cards()).toEqual(["X", "X"]);
  });

  test("cards returns card values without exposing internal storage", () => {
    const hand = new Hand();
    const card = buildCard(3, { visible: true });

    hand.add(card);

    const snapshot = hand.cards();
    snapshot[0] = 99;

    expect(hand.cards()).toEqual([3]);
  });

  test("show prints a matrix respecting configured lines", () => {
    const hand = new Hand(2);
    hand.add(buildCard(1, { visible: true }));
    hand.add(buildCard(2, { visible: true }));
    hand.add(buildCard(3, { visible: true }));

    expect(hand.show()).toBe("(3 cards) [[1, 2], [3]]");
  });

  test("rejects non-card entries", () => {
    const hand = new Hand();

    expect(() => hand.add({ value: 5 })).toThrow(
      "Hand can only store card objects"
    );
  });

  test.each([0, -1, 1.5, "2", null])(
    "rejects invalid line definitions %p",
    (badLines) => {
      expect(() => new Hand(badLines)).toThrow(
        "Hand lines must be a positive integer"
      );
    }
  );
});
