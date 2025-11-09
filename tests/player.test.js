import { Hand } from "../model/hand.js";
import { Player } from "../model/player.js";

describe("Player", () => {
  test("stores a trimmed name and creates a fresh hand by default", () => {
    const player = new Player("  Alice  ");

    expect(player.name).toBe("Alice");
    expect(player.hand).toBeInstanceOf(Hand);
    expect(player.hand.size).toBe(0);
  });

  test.each([null, undefined, 123, {}, [], () => {}])(
    "rejects non-string name value %p",
    (badName) => {
      expect(() => new Player(badName)).toThrow(
        "Player name must be a string"
      );
    }
  );

  test.each(["", "   "])("rejects empty name value %p", (badName) => {
    expect(() => new Player(badName)).toThrow("Player name must not be empty");
  });

  test("allows injecting an existing hand instance", () => {
    const existingHand = new Hand();
    const player = new Player("Bob", { hand: existingHand });

    expect(player.hand).toBe(existingHand);
  });

  test("rejects injected hand that is not a Hand instance", () => {
    expect(() => new Player("Carol", { hand: {} })).toThrow(
      "Player hand must be a Hand instance"
    );
  });
});

