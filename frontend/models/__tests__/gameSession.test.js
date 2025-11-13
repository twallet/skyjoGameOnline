import { Game } from "../game.js";
import { GameSession } from "../gameSession.js";
import { SkyjoPhases } from "../skyjoEngine.js";

const skyjo = new Game(
  "Skyjo",
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
  12,
  4,
  2,
  8
);

describe("GameSession", () => {
  describe("addPlayer", () => {
    it("adds players up to the maximum", () => {
      const session = new GameSession(skyjo);
      const players = [
        "Alice",
        "Bob",
        "Carol",
        "Dave",
        "Eve",
        "Frank",
        "Grace",
        "Heidi",
      ];

      let current = [];
      players.forEach((name, index) => {
        current = session.addPlayer(current, name);
        expect(current).toHaveLength(index + 1);
        expect(current).toContain(name);
      });

      expect(() => session.addPlayer(current, "Ivan")).toThrow(
        /cannot add more than 8 players/i
      );
    });

    it("rejects empty names", () => {
      const session = new GameSession(skyjo);
      expect(() => session.addPlayer([], "  ")).toThrow(/must not be empty/i);
    });

    it("rejects duplicate names", () => {
      const session = new GameSession(skyjo);
      const initial = session.addPlayer([], "Alice");

      expect(() => session.addPlayer(initial, "Alice")).toThrow(
        /must be unique/i
      );
    });
  });

  describe("start", () => {
    it("creates a dealer with players and returns session snapshot", () => {
      const session = new GameSession(skyjo);
      const playerNames = ["Alice", "Bob", "Carol"];
      const playerColors = ["red", "blue", "green"];

      const result = session.start(playerNames, playerColors);

      expect(result.players).toHaveLength(playerNames.length);
      result.players.forEach((player, index) => {
        expect(player).toEqual(
          expect.objectContaining({
            name: playerNames[index],
            color: playerColors[index],
            hand: expect.objectContaining({
              size: skyjo.handsize,
              lines: skyjo.lines,
              matrix: expect.any(Array),
            }),
          })
        );
      });

      expect(Array.isArray(result.logEntries)).toBe(true);
      expect(result.logEntries).toEqual(["Skyjo game started."]);

      expect(result.deck.size).toBeGreaterThan(0);
      expect(result.deck).toEqual(
        expect.objectContaining({
          discardSize: expect.any(Number),
        })
      );
      if (result.deck.topCard) {
        expect(result.deck.topCard).toEqual(
          expect.objectContaining({
            image: expect.any(String),
            visible: expect.any(Boolean),
          })
        );
      }

      expect(result.state).toEqual(
        expect.objectContaining({
          phase: SkyjoPhases.INITIAL_FLIP,
          activePlayerIndex: null,
          initialFlip: expect.objectContaining({
            requiredReveals: 2,
            resolved: false,
          }),
        })
      );
    });

    it("rejects when player count is below minimum", () => {
      const session = new GameSession(skyjo);
      expect(() => session.start(["Alice"])).toThrow(/at least 2 players/i);
    });

    it("announces the main phase starter once initial flip completes", () => {
      const session = new GameSession(skyjo);
      session.start(["Alice", "Bob"]);

      session.revealInitialCard("Alice", 0);
      session.revealInitialCard("Bob", 0);
      session.revealInitialCard("Alice", 1);
      const result = session.revealInitialCard("Bob", 1);

      expect(result.snapshot.state.phase).toBe(SkyjoPhases.MAIN_PLAY);
      const lastLog = session.logEntries[session.logEntries.length - 1];
      expect(lastLog).toMatch(
        /has the higher value \(\d+\)\. .* starts the round\./
      );
      expect(result.snapshot.state.activePlayer).toEqual(
        expect.objectContaining({ name: expect.any(String) })
      );
    });
  });

  describe("reset", () => {
    it("clears internal state", () => {
      const session = new GameSession(skyjo);
      session.start(["Alice", "Bob"]);

      session.reset();

      expect(session.players).toEqual([]);
      expect(session.logEntries).toEqual([]);
      expect(session.deckSnapshot).toEqual({ size: 0, topCard: null });
      expect(session.dealer).toBeNull();
      expect(session.getSnapshot()).toBeNull();
    });
  });

  describe("derived checks", () => {
    it("reports if the game can start or add more players", () => {
      const session = new GameSession(skyjo);

      expect(session.canStartGame(1)).toBe(false);
      expect(session.canAddPlayer(0)).toBe(true);

      const withTwo = session.addPlayer([], "Alice");
      const withThree = session.addPlayer(withTwo, "Bob");

      expect(session.canStartGame(withThree.length)).toBe(true);
      expect(session.canAddPlayer(7)).toBe(true);
      expect(session.canAddPlayer(8)).toBe(false);
    });
  });
});
