import { serializeSnapshot } from "../roomSerializers.js";

describe("roomSerializers.serializeSnapshot", () => {
  it("serializes players with handMatrix and handLines structure", () => {
    const snapshot = {
      players: [
        {
          name: "Alice",
          color: "#fff",
          hand: {
            size: 12,
            lines: 4,
            matrix: [
              [
                { value: 1, image: "1.png" },
                { value: 2, image: "2.png" },
              ],
            ],
          },
        },
        {
          name: "Bob",
          color: null,
          hand: {
            size: 0,
            lines: 0,
            matrix: [],
          },
        },
      ],
      logEntries: [],
      deck: { size: 30, topCard: null, discardSize: 5 },
      state: null,
    };

    const serialized = serializeSnapshot(snapshot);
    expect(serialized.players).toEqual([
      {
        name: "Alice",
        color: "#fff",
        handMatrix: [
          [
            { value: 1, image: "1.png" },
            { value: 2, image: "2.png" },
          ],
        ],
        handLines: 4,
      },
      {
        name: "Bob",
        color: null,
        handMatrix: [],
        handLines: null,
      },
    ]);
  });

  it("includes final round winner and scores in the serialized state", () => {
    const snapshot = {
      players: [
        {
          name: "Alice",
          color: "#fff",
          hand: {
            size: 12,
            lines: 4,
            matrix: [
              [
                { value: 1, image: "1.png" },
                { value: 2, image: "2.png" },
                { value: 3, image: "3.png" },
                { value: 4, image: "4.png" },
              ],
            ],
          },
        },
      ],
      logEntries: [],
      deck: { size: 30, topCard: null, discardSize: 5 },
      state: {
        phase: "finished",
        activePlayerIndex: null,
        activePlayer: null,
        initialFlip: {
          requiredReveals: 2,
          resolved: true,
          players: [
            {
              name: "Alice",
              color: "#fff",
              flippedPositions: [0, 1],
              total: 5,
              completed: true,
            },
          ],
        },
        discard: { size: 0, topCard: null },
        drawnCard: null,
        finalRound: {
          inProgress: false,
          triggeredBy: "Alice",
          pendingTurns: [],
          scores: [
            { name: "Alice", total: 10, doubled: false },
            { name: "Bob", total: 14, doubled: false },
          ],
          winner: "Alice",
        },
        pendingColumnRemovals: [],
      },
    };

    const serialized = serializeSnapshot(snapshot);
    expect(serialized.state.finalRound).toEqual(
      expect.objectContaining({
        winner: "Alice",
        scores: [
          expect.objectContaining({ name: "Alice", total: 10 }),
          expect.objectContaining({ name: "Bob", total: 14 }),
        ],
      })
    );
  });
});
