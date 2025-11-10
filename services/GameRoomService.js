import { GameSession } from "../model/gameSession.js";

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
  static getOrCreate(roomId, game, playerColors = []) {
    if (typeof roomId !== "string" || roomId.trim() === "") {
      throw new TypeError("Room id must be a non-empty string");
    }

    const trimmedId = roomId.trim();
    if (!GameRoomService.#registry.has(trimmedId)) {
      const service = new GameRoomService(game, playerColors, trimmedId);
      GameRoomService.#registry.set(trimmedId, service);
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

    return GameRoomService.#registry.delete(roomId.trim());
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

  constructor(game, playerColors = [], roomId = null) {
    this.#session = new GameSession(game);
    this.#playerColors = Array.isArray(playerColors) ? [...playerColors] : [];
    this.#roomId = roomId ?? null;
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
    return this.#session.start(this.#playerNames, this.#playerColors);
  }

  resetRoom() {
    this.#session.reset();
    this.#playerNames = [];
  }
}
