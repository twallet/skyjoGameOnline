import { jest } from "@jest/globals";
import {
  buildDeckView,
  getErrorMessage,
  normalizeRoomId,
  createRoomState,
  resetGameState,
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
  });

  describe("resetGameState", () => {
    it("calls all state setters with reset values", () => {
      const setCurrentSnapshot = jest.fn();
      const setSessionState = jest.fn();
      const setGameStarted = jest.fn();
      const setLogEntries = jest.fn();
      const setActivePlayers = jest.fn();
      const setDeckView = jest.fn();

      resetGameState(
        setCurrentSnapshot,
        setSessionState,
        setGameStarted,
        setLogEntries,
        setActivePlayers,
        setDeckView
      );

      expect(setCurrentSnapshot).toHaveBeenCalledWith(null);
      expect(setSessionState).toHaveBeenCalledWith(null);
      expect(setGameStarted).toHaveBeenCalledWith(false);
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
});
