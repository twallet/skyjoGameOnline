import { GameSession } from "../model/gameSession.js";
import { consoleLogger, resolveLogger, noopLogger } from "../utils/logger.js";

/**
 * Provides a facade between the UI layer and the core GameSession.
 */
export class GameRoomService {
  static #registry = new Map();

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

  constructor(game, playerColors = [], roomId = null, logger = noopLogger) {
    this.#logger = resolveLogger(logger);
    this.#session = new GameSession(game, this.#logger);
    this.#playerColors = Array.isArray(playerColors) ? [...playerColors] : [];
    this.#roomId = roomId ?? null;
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
    this.#playerNames = this.#session.addPlayer(this.#playerNames, rawName);
    const latestName = this.#playerNames[this.#playerNames.length - 1];
    this.#logger.info(
      `GameRoomService: player '${latestName}' joined room '${this.#roomId}'`
    );
    return this.playerNames;
  }

  canAddPlayer() {
    return this.#session.canAddPlayer(this.#playerNames.length);
  }

  canStartGame() {
    return this.#session.canStartGame(this.#playerNames.length);
  }

  /**
   * Deal cards and return the session snapshot.
   * @returns {{ players: import("../model/player.js").Player[], logEntries: string[], deck: { size: number, topCard: { value: string | number, image: string, visible: boolean } | null } }}
   */
  startGame() {
    this.#logger.info(
      `GameRoomService: starting game for room '${this.#roomId}'`
    );
    return this.#session.start(this.#playerNames, this.#playerColors);
  }

  resetRoom() {
    this.#session.reset();
    this.#playerNames = [];
    this.#logger.info(`GameRoomService: room '${this.#roomId}' reset`);
  }
}
