import { Card } from "../model/card.js";
import { Hand } from "../model/hand.js";

const skyjo = { name: "Skyjo", values: [-2, -1, 0, 1, 2, 3, 4, 5, 10] };

describe("Hand", () => {
  test("starts empty by default", () => {
    const hand = new Hand();

    expect(hand.size).toBe(0);
    expect(hand.values()).toEqual([]);
    expect(hand.show()).toBe("[] (0 cards)");
  });

  test("adds cards and updates the size", () => {
    const hand = new Hand();
    const goodCard = new Card(0, skyjo);

    hand.add(goodCard);
    expect(hand.size).toBe(1);

    hand.add(new Card(5, skyjo));
    expect(hand.size).toBe(2);
  });

  test("lists the numeric values of its cards", () => {
    const hand = new Hand();
    hand.add(new Card(-2, skyjo));
    hand.add(new Card(10, skyjo));

    expect(hand.values()).toEqual([-2, 10]);
  });

  test("validates that only card instances can be added", () => {
    const hand = new Hand();

    expect(() => hand.add(null)).toThrow("Hand can only store card objects");
    expect(() => hand.add({})).toThrow("Hand can only store card objects");
  });

  test("formats the values respecting the configured lines", () => {
    const hand = new Hand(4);

    Array.from(
      { length: 12 },
      (_, index) => skyjo.values[index % skyjo.values.length]
    ).forEach((value) => {
      hand.add(new Card(value, skyjo));
    });

    expect(hand.show()).toBe(
      "[[-2, -1, 0, 1], [2, 3, 4, 5], [10, -2, -1, 0]] (12 cards)"
    );
  });
});
