import { Game } from "../../../shared/models/game.js";
import { GameSession } from "../../../shared/models/gameSession.js";
import { SkyjoPhases } from "../../../shared/models/skyjoEngine.js";
import { Card } from "../../../shared/models/card.js";

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
      expect(result.logEntries).toEqual([
        expect.objectContaining({
          message: "Skyjo game started.",
          phase: "initial-flip",
          actor: null,
        }),
      ]);

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
          phase: SkyjoPhases.PREPARATION,
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

      expect(result.snapshot.state.phase).toBe(SkyjoPhases.PLAYING);
      const logs = session.logEntries;
      const lastLog = logs[logs.length - 1];
      const previousLog = logs[logs.length - 2];
      const starterName = result.snapshot.state.activePlayer?.name ?? null;

      expect(previousLog).toEqual(
        expect.objectContaining({
          message: expect.stringMatching(/has the highest value/),
          phase: "main-play",
        })
      );
      if (starterName) {
        expect(previousLog.actor).toBe(starterName);
        expect(lastLog).toEqual(
          expect.objectContaining({
            message: `${starterName} starts the round.`,
            phase: "main-play",
            actor: starterName,
          })
        );
      } else {
        expect(previousLog.actor).toEqual(expect.any(String));
        expect(lastLog).toEqual(
          expect.objectContaining({
            message: expect.stringMatching(/starts the round\./),
            phase: "main-play",
            actor: expect.any(String),
          })
        );
      }
      expect(result.snapshot.state.activePlayer).toEqual(
        expect.objectContaining({ name: expect.any(String) })
      );
    });
  });

  it("adds a log entry when a player reveals every card", () => {
    const session = new GameSession(skyjo);
    session.start(["Alice", "Bob"]);

    session.revealInitialCard("Alice", 0);
    session.revealInitialCard("Bob", 0);
    session.revealInitialCard("Alice", 1);
    session.revealInitialCard("Bob", 1);

    const snapshot = session.getSnapshot();
    const activeName = snapshot.state?.activePlayer?.name ?? "Alice";
    const targetPlayer =
      session.players.find((player) => player.name === activeName) ??
      session.players[0];

    const targetHand = targetPlayer.hand;
    const lastIndex = targetHand.size - 1;
    for (let position = 0; position < lastIndex; position += 1) {
      if (!targetHand.isCardVisible(position)) {
        targetHand.revealCard(position);
      }
    }

    session.drawCard(targetPlayer.name, "deck");
    session.discardDrawnCardAndReveal(targetPlayer.name, lastIndex);

    const lastLog = session.logEntries.at(-1);
    expect(lastLog).toEqual(
      expect.objectContaining({
        message: expect.stringMatching(
          new RegExp(
            `${targetPlayer.name} revealed all cards and triggered the final round with \\d+ points\\.`
          )
        ),
        actor: targetPlayer.name,
        phase: "final-round",
      })
    );
  });

  /*it("logs final scores and winner once the Game is finished", () => {
    const session = new GameSession(skyjo);
    session.start(["Alice", "Bob"]);

    ["Alice", "Bob"].forEach((name) => {
      session.revealInitialCard(name, 0);
      session.revealInitialCard(name, 1);
    });

    const [alice] = session.players;
    const revealAllButLast = (hand) => {
      const lastIndex = hand.size - 1;
      for (let index = 0; index < hand.size; index += 1) {
        if (index === lastIndex || hand.isCardVisible(index)) {
          continue;
        }
        hand.revealCard(index);
      }
      return lastIndex;
    };
    const aliceFinalIndex = revealAllButLast(alice.hand);

    const ensureHiddenIndex = (hand) => {
      for (let index = 0; index < hand.size; index += 1) {
        if (!hand.isCardVisible(index)) {
          return index;
        }
      }
      return 0;
    };

    const deck = session.dealer.deck;
    deck.add(new Card(4, skyjo)); // Reserved for Bob
    deck.add(new Card(3, skyjo)); // Alice draws this card first

    session.drawCard("Alice", "deck");
    session.discardDrawnCardAndReveal("Alice", aliceFinalIndex);

    const nextSnapshot = session.getSnapshot();
    const activePlayerIndex = nextSnapshot?.state?.activePlayerIndex;
    const activePlayerName = nextSnapshot?.state?.activePlayer?.name ?? null;
    const nextPlayer =
      Number.isInteger(activePlayerIndex) && session.players[activePlayerIndex]
        ? session.players[activePlayerIndex]
        : session.players.find((player) => player.name === activePlayerName);
    console.log("DEBUG final-round", {
      phase: nextSnapshot?.state?.phase,
      activePlayerIndex,
      activePlayerName,
      resolvedPlayer: nextPlayer?.name,
    });
    if (
      nextSnapshot?.state?.phase !== SkyjoPhases.FINISHED &&
      nextPlayer?.name
    ) {
      session.drawCard(nextPlayer.name, "deck");
      const nextRevealIndex = ensureHiddenIndex(nextPlayer.hand);
      session.discardDrawnCardAndReveal(nextPlayer.name, nextRevealIndex);
    }

    const snapshot = session.getSnapshot();
    expect(snapshot.state.phase).toBe(SkyjoPhases.FINISHED);

    const finishedLogs = session.logEntries.filter(
      (entry) => entry.phase === SkyjoPhases.FINISHED
    );
    expect(
      finishedLogs.filter((entry) => /cards sum to/i.test(entry.message))
    ).toHaveLength(2);
    const winnerLog = finishedLogs.at(-1);
    expect(winnerLog.message).toMatch(/wins/i);
  });*/

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
