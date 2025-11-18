// Service that manages game rooms and their lifecycle, wrapping GameSession instances.
import { GameSession } from "../../shared/models/gameSession.js";
import {
  consoleLogger,
  resolveLogger,
  noopLogger,
} from "../../shared/utils/logger.js";

/**
 * Provides a facade between the UI layer and the core GameSession.
 * Manages a singleton registry of active game rooms in memory.
 */
export class gameRoomService {
  // In-memory registry mapping room IDs to service instances.
  static #registry = new Map();

  // Read-only lookup of a room by ID without creating it.
  static peek(roomId) {
    if (typeof roomId !== "string") {
      return null;
    }

    const trimmed = roomId.trim();
    if (!trimmed) {
      return null;
    }

    return gameRoomService.#registry.get(trimmed) ?? null;
  }

  /**
   * Retrieve an existing room or create a new one for the provided identifier.
   * @param {string} roomId
   * @param {Game} game
   * @param {string[]} [playerColors]
   * @returns {gameRoomService}
   */
  static getOrCreate(roomId, game, playerColors = [], logger = consoleLogger) {
    if (typeof roomId !== "string" || roomId.trim() === "") {
      throw new TypeError("Room id must be a non-empty string");
    }

    const trimmedId = roomId.trim();
    if (!gameRoomService.#registry.has(trimmedId)) {
      const service = new gameRoomService(
        game,
        playerColors,
        trimmedId,
        logger
      );
      gameRoomService.#registry.set(trimmedId, service);
      service.#logger.info(
        `gameRoomService: created room '${trimmedId}' with game ${game.name}`
      );
    }

    return gameRoomService.#registry.get(trimmedId);
  }

  /**
   * Return the identifiers of all currently registered rooms.
   * @returns {string[]}
   */
  static listRoomIds() {
    return Array.from(gameRoomService.#registry.keys());
  }

  /**
   * Log the list of registered rooms using the provided logger.
   * @param {Partial<Record<"info" | "warn" | "error", (...args: unknown[]) => void>>} logger
   * @returns {string[]}
   */
  static logRooms(logger = consoleLogger) {
    const resolvedLogger = resolveLogger(logger);
    const roomIds = gameRoomService.listRoomIds();
    if (roomIds.length === 0) {
      resolvedLogger.info("gameRoomService: no active rooms.");
    } else {
      resolvedLogger.info(
        `gameRoomService: active rooms (${roomIds.length}): ${roomIds.join(
          ", "
        )}`
      );
    }
    return roomIds;
  }

  /**
   * Remove an existing room from the registry.
   * @param {string} roomId
   * @returns {boolean}
   */
  static remove(roomId) {
    if (typeof roomId !== "string") {
      return false;
    }

    const trimmed = roomId.trim();
    const existing = gameRoomService.#registry.get(trimmed);
    if (!existing) {
      return false;
    }

    gameRoomService.#registry.delete(trimmed);
    existing.#logger.info(`gameRoomService: removed room '${trimmed}'`);
    return true;
  }

  /**
   * Clear all rooms (useful for tests).
   */
  static clearRegistry() {
    gameRoomService.#registry.clear();
  }

  // Core game session that handles all game logic.
  #session;
  // List of player names that have joined this room.
  #playerNames = [];
  // Color palette assigned to players (one per player index).
  #playerColors;
  // Unique identifier for this room.
  #roomId;
  // Logger instance for this room's events.
  #logger;
  // Cached snapshot of the game state (null until game starts).
  #lastSnapshot = null;

  // Initializes a new room service with game configuration and dependencies.
  constructor(game, playerColors = [], roomId = null, logger = noopLogger) {
    this.#logger = resolveLogger(logger);
    this.#session = new GameSession(game, this.#logger);
    this.#playerColors = Array.isArray(playerColors) ? [...playerColors] : [];
    this.#roomId = roomId ?? null;
    this.#lastSnapshot = null;
    this.#logger.info(
      `gameRoomService: initialized room '${this.#roomId ?? "unknown"}'`
    );
  }

  // Returns the room's unique identifier.
  get roomId() {
    return this.#roomId;
  }

  // Returns a copy of the current player names list.
  get playerNames() {
    return [...this.#playerNames];
  }

  /**
   * Add a player to the room, returning the updated list.
   * @param {string} rawName
   * @returns {string[]}
   */
  addPlayer(rawName) {
    if (this.#lastSnapshot) {
      throw new Error("Cannot add players after the game has started.");
    }

    this.#playerNames = this.#session.addPlayer(this.#playerNames, rawName);
    const latestName = this.#playerNames[this.#playerNames.length - 1];
    this.#logger.info(
      `gameRoomService: player '${latestName}' joined room '${this.#roomId}'`
    );
    return this.playerNames;
  }

  // Checks if another player can be added (game not started and under max limit).
  canAddPlayer() {
    if (this.#lastSnapshot) {
      return false;
    }
    return this.#session.canAddPlayer(this.#playerNames.length);
  }

  // Checks if the game can be started (enough players and game not already started).
  canStartGame() {
    if (this.#lastSnapshot) {
      return false;
    }
    return this.#session.canStartGame(this.#playerNames.length);
  }

  /**
   * Deal cards and return the session snapshot.
   * @returns {{ players: import("../models/player.js").Player[], logEntries: string[], deck: { size: number, topCard: { value: string | number, image: string, visible: boolean } | null } }}
   */
  startGame() {
    if (this.#lastSnapshot) {
      throw new Error("Game has already started for this room.");
    }

    this.#logger.info(
      `gameRoomService: starting game for room '${this.#roomId}'`
    );
    const snapshot = this.#session.start(this.#playerNames, this.#playerColors);
    this.#lastSnapshot = snapshot;
    return snapshot;
  }

  // Returns the current game state snapshot, or null if the game hasn't started.
  getSnapshot() {
    if (!this.#lastSnapshot) {
      return null;
    }
    return this.#session.getSnapshot();
  }

  // Reveals a card during the initial flip phase before main gameplay begins.
  revealInitialCard(playerName, position) {
    if (!this.#lastSnapshot) {
      throw new Error("Game has not started in this room.");
    }

    const result = this.#session.revealInitialCard(
      playerName,
      Number(position)
    );
    this.#lastSnapshot = result.snapshot;
    return result;
  }

  // Draws a card from the deck or discard pile during main gameplay.
  drawCard(playerName, source) {
    if (!this.#lastSnapshot) {
      throw new Error("Game has not started in this room.");
    }

    const result = this.#session.drawCard(playerName, source);
    this.#lastSnapshot = result.snapshot;
    return result;
  }

  // Replaces a card in the player's hand with the previously drawn card.
  replaceWithDrawnCard(playerName, position) {
    if (!this.#lastSnapshot) {
      throw new Error("Game has not started in this room.");
    }

    const result = this.#session.replaceWithDrawnCard(
      playerName,
      Number(position)
    );
    this.#lastSnapshot = result.snapshot;
    return result;
  }

  // Discards the drawn card and reveals a card from the player's hand instead.
  discardDrawnCardAndReveal(playerName, position) {
    if (!this.#lastSnapshot) {
      throw new Error("Game has not started in this room.");
    }

    const result = this.#session.discardDrawnCardAndReveal(
      playerName,
      Number(position)
    );
    this.#lastSnapshot = result.snapshot;
    return result;
  }

  // Resets the room to its initial state, clearing players and game state.
  resetRoom() {
    this.#session.reset();
    this.#playerNames = [];
    this.#lastSnapshot = null;
    this.#logger.info(`gameRoomService: room '${this.#roomId}' reset`);
  }
}
