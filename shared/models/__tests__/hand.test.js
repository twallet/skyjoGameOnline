import { Hand } from "../hand.js";
import { Card } from "../card.js";

const buildGame = (maxValue = 12) => {
  const values = Array.from({ length: maxValue }, (_, index) => index + 1);
  const images = values.map((value) => `images/test-theme-${value}.jpg`);

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
  const maxValue = Math.max(12, Number(value) || 0);
  const game = buildGame(maxValue);
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

  test("replaceCard swaps the card at position and returns previous card", () => {
    const hand = new Hand();
    const first = buildCard(1, { visible: true });
    const second = buildCard(2);
    const replacement = buildCard(3, { visible: true });

    hand.add(first);
    hand.add(second);

    const removed = hand.replaceCard(0, replacement);

    expect(removed).toBe(first);
    expect(hand.cards()).toEqual([3, "X"]);
  });

  test.each([0, -1, 1.5, "2", null])(
    "rejects invalid line definitions %p",
    (badLines) => {
      expect(() => new Hand(badLines)).toThrow(
        "Hand lines must be a positive integer"
      );
    }
  );

  test("removeColumn removes the entire column and keeps remaining cards aligned", () => {
    const hand = new Hand(4);
    const cards = [];
    for (let index = 0; index < 12; index += 1) {
      const card = buildCard(index + 1, { visible: true });
      cards.push(card);
      hand.add(card);
    }

    const removed = hand.removeColumn(1);

    expect(removed).toHaveLength(3);
    expect(hand.lines).toBe(3);
    expect(hand.rows).toBe(3);
    expect(hand.cardsMatrix()).toEqual([
      [
        { value: 1, image: expect.any(String) },
        { value: 3, image: expect.any(String) },
        { value: 4, image: expect.any(String) },
      ],
      [
        { value: 5, image: expect.any(String) },
        { value: 7, image: expect.any(String) },
        { value: 8, image: expect.any(String) },
      ],
      [
        { value: 9, image: expect.any(String) },
        { value: 11, image: expect.any(String) },
        { value: 12, image: expect.any(String) },
      ],
    ]);
  });

  test("removeColumn throws when column index is invalid", () => {
    const hand = new Hand(3);
    hand.add(buildCard(1));
    hand.add(buildCard(2));
    hand.add(buildCard(3));

    expect(() => hand.removeColumn(-1)).toThrow("Column index out of bounds");
    expect(() => hand.removeColumn(3)).toThrow("Column index out of bounds");
  });

  test("revealAllCards turns every hidden card face up", () => {
    const hand = new Hand();
    const hidden = buildCard(1);
    const anotherHidden = buildCard(2);
    const visible = buildCard(3, { visible: true });

    hand.add(hidden);
    hand.add(anotherHidden);
    hand.add(visible);

    hand.revealAllCards();

    expect(hand.cards()).toEqual([1, 2, 3]);
    expect(hand.allCardsVisible()).toBe(true);
  });

  test("isCardVisible returns false for hidden cards", () => {
    const hand = new Hand();
    hand.add(buildCard(1));
    hand.add(buildCard(2, { visible: true }));

    expect(hand.isCardVisible(0)).toBe(false);
    expect(hand.isCardVisible(1)).toBe(true);
  });

  test("revealCard reveals a hidden card and returns card data", () => {
    const hand = new Hand();
    const card = buildCard(5);
    hand.add(card);

    const result = hand.revealCard(0);

    expect(result.value).toBe(5);
    expect(result.image).toBeTruthy();
    expect(hand.isCardVisible(0)).toBe(true);
    expect(hand.cards()[0]).toBe(5);
  });

  test("revealCard throws when card is already visible", () => {
    const hand = new Hand();
    hand.add(buildCard(1, { visible: true }));

    expect(() => hand.revealCard(0)).toThrow("Card is already visible");
  });

  test.each([
    ["non-integer", 1.5],
    ["negative", -1],
    ["out of bounds", 10],
    ["null", null],
    ["undefined", undefined],
  ])(
    "revealCard throws when position is invalid (%s)",
    (_label, badPosition) => {
      const hand = new Hand();
      hand.add(buildCard(1));

      expect(() => hand.revealCard(badPosition)).toThrow();
    }
  );

  test.each([
    ["non-integer", 1.5],
    ["negative", -1],
    ["out of bounds", 10],
    ["null", null],
  ])(
    "replaceCard throws when position is invalid (%s)",
    (_label, badPosition) => {
      const hand = new Hand();
      hand.add(buildCard(1));
      const replacement = buildCard(2);

      expect(() => hand.replaceCard(badPosition, replacement)).toThrow();
    }
  );

  test("replaceCard throws when replacement is not a Card instance", () => {
    const hand = new Hand();
    hand.add(buildCard(1));

    expect(() => hand.replaceCard(0, { value: 5 })).toThrow(
      "Hand can only store card objects"
    );
  });

  test("matrix getter returns same result as cardsMatrix", () => {
    const hand = new Hand(2);
    hand.add(buildCard(1, { visible: true }));
    hand.add(buildCard(2, { visible: true }));

    expect(hand.matrix).toEqual(hand.cardsMatrix());
  });

  test("columns getter returns same value as lines", () => {
    const hand = new Hand(4);

    expect(hand.columns).toBe(4);
    expect(hand.columns).toBe(hand.lines);
  });

  test("rows getter calculates correct number of rows", () => {
    const hand = new Hand(3);
    expect(hand.rows).toBe(0);

    hand.add(buildCard(1));
    hand.add(buildCard(2));
    hand.add(buildCard(3));
    expect(hand.rows).toBe(1);

    hand.add(buildCard(4));
    hand.add(buildCard(5));
    hand.add(buildCard(6));
    expect(hand.rows).toBe(2);

    hand.add(buildCard(7));
    expect(hand.rows).toBe(2);
  });

  test("allCardsVisible returns false when some cards are hidden", () => {
    const hand = new Hand();
    hand.add(buildCard(1, { visible: true }));
    hand.add(buildCard(2));
    hand.add(buildCard(3, { visible: true }));

    expect(hand.allCardsVisible()).toBe(false);
  });

  test("allCardsVisible returns true when all cards are visible", () => {
    const hand = new Hand();
    hand.add(buildCard(1, { visible: true }));
    hand.add(buildCard(2, { visible: true }));

    expect(hand.allCardsVisible()).toBe(true);
  });

  test("allCardsVisible returns true for empty hand", () => {
    const hand = new Hand();
    expect(hand.allCardsVisible()).toBe(true);
  });

  test("removeColumn returns empty array for empty hand", () => {
    const hand = new Hand(3);
    const removed = hand.removeColumn(0);

    expect(removed).toEqual([]);
    expect(hand.lines).toBe(3);
  });

  test("removeColumn maintains minimum of 1 line", () => {
    const hand = new Hand(2);
    hand.add(buildCard(1));
    hand.add(buildCard(2));

    hand.removeColumn(0);
    expect(hand.lines).toBe(1);

    hand.removeColumn(0);
    expect(hand.lines).toBe(1);
  });

  test("removeColumn throws when columnIndex is not an integer", () => {
    const hand = new Hand(3);
    hand.add(buildCard(1));

    expect(() => hand.removeColumn(1.5)).toThrow(
      "Column index must be an integer"
    );
    expect(() => hand.removeColumn("1")).toThrow(
      "Column index must be an integer"
    );
  });

  test("show returns formatted string for empty hand", () => {
    const hand = new Hand();
    expect(hand.show()).toBe("(0 cards) []");
  });

  test("cardsMatrix returns empty array for empty hand", () => {
    const hand = new Hand();
    expect(hand.cardsMatrix()).toEqual([]);
  });

  test("cardsMatrix handles cards that span multiple rows correctly", () => {
    const hand = new Hand(2);
    hand.add(buildCard(1, { visible: true }));
    hand.add(buildCard(2, { visible: true }));
    hand.add(buildCard(3, { visible: true }));
    hand.add(buildCard(4, { visible: true }));
    hand.add(buildCard(5, { visible: true }));

    const matrix = hand.cardsMatrix();
    expect(matrix).toHaveLength(3);
    expect(matrix[0]).toHaveLength(2);
    expect(matrix[1]).toHaveLength(2);
    expect(matrix[2]).toHaveLength(1);
  });
});
