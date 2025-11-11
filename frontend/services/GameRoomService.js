import { GameSession } from "../models/gameSession.js";
import { consoleLogger, resolveLogger, noopLogger } from "../utils/logger.js";

/**
 * Provides a facade between the UI layer and the core GameSession.
 */
export class GameRoomService {
  static #registry = new Map();
  static peek(roomId) {
    if (typeof roomId !== "string") {
      return null;
    }

    const trimmed = roomId.trim();
    if (!trimmed) {
      return null;
    }

    return GameRoomService.#registry.get(trimmed) ?? null;
  }

  /**
   * Retrieve an existing room or create a new one for the provided identifier.
   * @param {string} roomId
   * @param {Game} game
   * @param {string[]} [playerColors]
   * @returns {GameRoomService}
   */
  static getOrCreate(roomId, game, playerColors = [], logger = consoleLogger) {
    if (typeof roomId !== "string" || roomId.trim() === "") {
      throw new TypeError("Room id must be a non-empty string");
    }

    const trimmedId = roomId.trim();
    if (!GameRoomService.#registry.has(trimmedId)) {
      const service = new GameRoomService(
        game,
        playerColors,
        trimmedId,
        logger
      );
      GameRoomService.#registry.set(trimmedId, service);
      service.#logger.info(
        `GameRoomService: created room '${trimmedId}' with game ${game.name}`
      );
    } else {
      const existing = GameRoomService.#registry.get(trimmedId);
      existing.#logger.info(
        `GameRoomService: reusing existing room '${trimmedId}'`
      );
    }

    return GameRoomService.#registry.get(trimmedId);
  }

  /**
   * Return the identifiers of all currently registered rooms.
   * @returns {string[]}
   */
  static listRoomIds() {
    return Array.from(GameRoomService.#registry.keys());
  }

  /**
   * Log the list of registered rooms using the provided logger.
   * @param {Partial<Record<"info" | "warn" | "error", (...args: unknown[]) => void>>} logger
   * @returns {string[]}
   */
  static logRooms(logger = consoleLogger) {
    const resolvedLogger = resolveLogger(logger);
    const roomIds = GameRoomService.listRoomIds();
    if (roomIds.length === 0) {
      resolvedLogger.info("GameRoomService: no active rooms.");
    } else {
      resolvedLogger.info(
        `GameRoomService: active rooms (${roomIds.length}): ${roomIds.join(
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
    const existing = GameRoomService.#registry.get(trimmed);
    if (!existing) {
      return false;
    }

    GameRoomService.#registry.delete(trimmed);
    existing.#logger.info(`GameRoomService: removed room '${trimmed}'`);
    return true;
  }

  /**
   * Clear all rooms (useful for tests).
   */
  static clearRegistry() {
    GameRoomService.#registry.clear();
  }

  #session;
  #playerNames = [];
  #playerColors;
  #roomId;
  #logger;
  #lastSnapshot = null;

  constructor(game, playerColors = [], roomId = null, logger = noopLogger) {
    this.#logger = resolveLogger(logger);
    this.#session = new GameSession(game, this.#logger);
    this.#playerColors = Array.isArray(playerColors) ? [...playerColors] : [];
    this.#roomId = roomId ?? null;
    this.#lastSnapshot = null;
    this.#logger.info(
      `GameRoomService: initialized room '${this.#roomId ?? "unknown"}'`
    );
  }

  get roomId() {
    return this.#roomId;
  }

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
      `GameRoomService: player '${latestName}' joined room '${this.#roomId}'`
    );
    return this.playerNames;
  }

  canAddPlayer() {
    if (this.#lastSnapshot) {
      return false;
    }
    return this.#session.canAddPlayer(this.#playerNames.length);
  }

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
      `GameRoomService: starting game for room '${this.#roomId}'`
    );
    const snapshot = this.#session.start(this.#playerNames, this.#playerColors);
    this.#lastSnapshot = snapshot;
    return snapshot;
  }

  getSnapshot() {
    return this.#lastSnapshot;
  }

  resetRoom() {
    this.#session.reset();
    this.#playerNames = [];
    this.#lastSnapshot = null;
    this.#logger.info(`GameRoomService: room '${this.#roomId}' reset`);
  }
}
