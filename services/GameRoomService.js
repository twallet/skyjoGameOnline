import { GameSession } from "../model/gameSession.js";

/**
 * Provides a facade between the UI layer and the core GameSession.
 */
export class GameRoomService {
  #session;
  #playerNames = [];
  #playerColors;

  constructor(game, playerColors = []) {
    this.#session = new GameSession(game);
    this.#playerColors = Array.isArray(playerColors) ? [...playerColors] : [];
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
