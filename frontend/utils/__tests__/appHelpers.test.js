import { buildDeckView, normalizePlayerSnapshots } from "../appHelpers.js";

describe("app helpers", () => {
  describe("buildDeckView", () => {
    it("returns null when no deck snapshot provided", () => {
      expect(buildDeckView(null)).toBeNull();
      expect(buildDeckView(undefined)).toBeNull();
    });

    it("normalizes deck data with hidden top card", () => {
      const deck = {
        size: 42,
        topCard: {
          image: "top.png",
          value: 5,
          visible: false,
        },
        backImage: "./assets/images/back.jpg",
      };

      const view = buildDeckView(deck);

      expect(view).toEqual({
        size: 42,
        baseImage: "./assets/images/back.jpg",
        firstCard: {
          image: "top.png",
          visible: false,
          alt: "Hidden top card",
        },
      });
    });

    it("includes visible card value in alt text", () => {
      const deck = {
        size: 10,
        topCard: {
          image: "card.png",
          value: "A",
          visible: true,
        },
        backImage: "./assets/images/back.jpg",
      };

      const view = buildDeckView(deck);

      expect(view.firstCard.alt).toBe("Top card A");
    });

    it("handles missing backImage gracefully", () => {
      const deck = {
        size: 5,
        topCard: null,
      };

      const view = buildDeckView(deck);

      expect(view).toEqual({
        size: 5,
        baseImage: null,
        firstCard: null,
      });
    });
  });

  describe("normalizePlayerSnapshots", () => {
    it("returns empty array for non-array input", () => {
      expect(normalizePlayerSnapshots(null)).toEqual([]);
      expect(normalizePlayerSnapshots({})).toEqual([]);
    });

    it("creates safe player representations", () => {
      const players = [
        {
          name: "Alice",
          color: "#fff",
          hand: { matrix: [[1, 2]], lines: 4 },
        },
        {
          name: "Bob",
        },
      ];

      expect(normalizePlayerSnapshots(players)).toEqual([
        {
          name: "Alice",
          color: "#fff",
          handMatrix: [[1, 2]],
          handLines: 4,
        },
        { name: "Bob", color: null, handMatrix: [], handLines: null },
      ]);
    });
  });
});
