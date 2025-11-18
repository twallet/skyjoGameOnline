import { jest } from "@jest/globals";
import {
  buildDeckView,
  getErrorMessage,
  normalizeRoomId,
  createRoomState,
  resetGameState,
  extractLogEntryMessage,
  validatePlayerName,
  normalizePlayerNames,
  normalizePlayerName,
} from "../appHelpers.js";
import { Game } from "../../../shared/models/game.js";

describe("app helpers", () => {
  describe("getErrorMessage", () => {
    it("extracts message from Error instances", () => {
      const error = new Error("Test error message");
      expect(getErrorMessage(error)).toBe("Test error message");
    });

    it("converts non-Error values to strings", () => {
      expect(getErrorMessage("string error")).toBe("string error");
      expect(getErrorMessage(123)).toBe("123");
      expect(getErrorMessage(null)).toBe("null");
      expect(getErrorMessage(undefined)).toBe("undefined");
    });
  });

  describe("normalizeRoomId", () => {
    it("trims and uppercases valid string room IDs", () => {
      expect(normalizeRoomId("abc123")).toBe("ABC123");
      expect(normalizeRoomId("  test  ")).toBe("TEST");
      expect(normalizeRoomId("lowercase")).toBe("LOWERCASE");
    });

    it("returns empty string for invalid inputs", () => {
      expect(normalizeRoomId("")).toBe("");
      expect(normalizeRoomId("   ")).toBe("");
      expect(normalizeRoomId(null)).toBe("");
      expect(normalizeRoomId(undefined)).toBe("");
      expect(normalizeRoomId(123)).toBe("");
    });
  });

  describe("createRoomState", () => {
    const mockGame = new Game(
      "Test",
      [1, 2, 3],
      [1, 1, 1],
      ["img1.jpg", "img2.jpg", "img3.jpg"],
      "back.jpg",
      3,
      2,
      2,
      4
    );

    it("creates room state with player validation", () => {
      const state = createRoomState(["Alice", "Bob"], mockGame, false);
      expect(state).toEqual({
        players: ["Alice", "Bob"],
        canAddPlayer: true,
        canStartGame: true,
        gameStarted: false,
      });
    });

    it("sets canAddPlayer to false when at max players", () => {
      const state = createRoomState(
        ["Alice", "Bob", "Charlie", "Dave"],
        mockGame,
        false
      );
      expect(state.canAddPlayer).toBe(false);
      expect(state.canStartGame).toBe(true);
    });

    it("sets canStartGame to false when below min players", () => {
      const state = createRoomState(["Alice"], mockGame, false);
      expect(state.canAddPlayer).toBe(true);
      expect(state.canStartGame).toBe(false);
    });

    it("preserves gameStarted flag", () => {
      const state = createRoomState(["Alice", "Bob"], mockGame, true);
      expect(state.gameStarted).toBe(true);
    });

    it("handles empty array correctly", () => {
      const state = createRoomState([], mockGame, false);
      expect(state).toEqual({
        players: [],
        canAddPlayer: true,
        canStartGame: false,
        gameStarted: false,
      });
    });

    it("throws TypeError when players is null or undefined", () => {
      expect(() => {
        createRoomState(null, mockGame, false);
      }).toThrow(TypeError);
      expect(() => {
        createRoomState(undefined, mockGame, false);
      }).toThrow(TypeError);
    });

    it("produces incorrect results when players is not an array (string)", () => {
      // This test documents that createRoomState expects an array
      // Non-array inputs will produce incorrect results
      const state = createRoomState("not an array", mockGame, false);
      // String has length property, so it won't throw but produces wrong results
      expect(state.players).toBe("not an array");
      expect(typeof state.canAddPlayer).toBe("boolean");
    });
  });

  describe("resetGameState", () => {
    it("calls all state setters with reset values", () => {
      const setCurrentSnapshot = jest.fn();
      const setGameState = jest.fn();
      const setLogEntries = jest.fn();
      const setActivePlayers = jest.fn();
      const setDeckView = jest.fn();

      resetGameState(
        setCurrentSnapshot,
        setGameState,
        setLogEntries,
        setActivePlayers,
        setDeckView
      );

      expect(setCurrentSnapshot).toHaveBeenCalledWith(null);
      expect(setGameState).toHaveBeenCalledWith(null);
      expect(setLogEntries).toHaveBeenCalledWith([]);
      expect(setActivePlayers).toHaveBeenCalledWith([]);
      expect(setDeckView).toHaveBeenCalledWith(null);
    });
  });

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

    it("handles missing backImage gracefully with default fallback", () => {
      const deck = {
        size: 5,
        topCard: null,
      };

      const view = buildDeckView(deck);

      expect(view).toEqual({
        size: 5,
        baseImage: "./assets/images/back.jpg",
        firstCard: null,
      });
    });
  });

  describe("extractLogEntryMessage", () => {
    it("extracts message from object entries", () => {
      expect(extractLogEntryMessage({ message: "Test message" })).toBe(
        "Test message"
      );
      expect(extractLogEntryMessage({ message: "" })).toBe("");
    });

    it("handles object entries without message property", () => {
      expect(extractLogEntryMessage({ other: "value" })).toBe("");
      expect(extractLogEntryMessage({})).toBe("");
    });

    it("converts string entries to strings", () => {
      expect(extractLogEntryMessage("String message")).toBe("String message");
      expect(extractLogEntryMessage("")).toBe("");
    });

    it("handles null and undefined", () => {
      expect(extractLogEntryMessage(null)).toBe("");
      expect(extractLogEntryMessage(undefined)).toBe("");
    });

    it("converts other types to strings", () => {
      expect(extractLogEntryMessage(123)).toBe("123");
      expect(extractLogEntryMessage(true)).toBe("true");
    });
  });

  describe("validatePlayerName", () => {
    it("returns valid for names within length limit", () => {
      const result = validatePlayerName("Alice", 10);
      expect(result.isValid).toBe(true);
      expect(result.errorMessage).toBe("");
    });

    it("returns invalid for empty names", () => {
      const result = validatePlayerName("", 10);
      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe("Player name must not be empty.");
    });

    it("returns invalid for names exceeding max length", () => {
      const result = validatePlayerName("VeryLongPlayerName", 10);
      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe(
        "Player name must be 10 characters or fewer."
      );
    });

    it("handles whitespace-only names as empty", () => {
      const result = validatePlayerName("   ", 10);
      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe("Player name must not be empty.");
    });

    it("trims whitespace before validation", () => {
      const result = validatePlayerName("  Alice  ", 10);
      expect(result.isValid).toBe(true);
      expect(result.errorMessage).toBe("");
    });

    it("handles non-string inputs", () => {
      const result = validatePlayerName(null, 10);
      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe("Player name must not be empty.");
    });
  });

  describe("normalizePlayerNames", () => {
    it("trims and filters valid player names", () => {
      expect(normalizePlayerNames(["Alice", "Bob", "Charlie"])).toEqual([
        "Alice",
        "Bob",
        "Charlie",
      ]);
    });

    it("trims whitespace from names", () => {
      expect(normalizePlayerNames(["  Alice  ", " Bob ", "Charlie"])).toEqual([
        "Alice",
        "Bob",
        "Charlie",
      ]);
    });

    it("filters out empty strings", () => {
      expect(normalizePlayerNames(["Alice", "", "Bob", "   "])).toEqual([
        "Alice",
        "Bob",
      ]);
    });

    it("handles non-string values", () => {
      expect(normalizePlayerNames(["Alice", 123, null, "Bob"])).toEqual([
        "Alice",
        "Bob",
      ]);
    });

    it("returns empty array for non-array input", () => {
      expect(normalizePlayerNames(null)).toEqual([]);
      expect(normalizePlayerNames(undefined)).toEqual([]);
      expect(normalizePlayerNames("not an array")).toEqual([]);
    });

    it("handles empty array", () => {
      expect(normalizePlayerNames([])).toEqual([]);
    });
  });

  describe("normalizePlayerName", () => {
    it("trims valid player names", () => {
      expect(normalizePlayerName("Alice")).toBe("Alice");
      expect(normalizePlayerName("  Alice  ")).toBe("Alice");
    });

    it("returns empty string for empty input", () => {
      expect(normalizePlayerName("")).toBe("");
      expect(normalizePlayerName("   ")).toBe("");
    });

    it("returns empty string for invalid inputs", () => {
      expect(normalizePlayerName(null)).toBe("");
      expect(normalizePlayerName(undefined)).toBe("");
      expect(normalizePlayerName(123)).toBe("");
    });
  });
});
