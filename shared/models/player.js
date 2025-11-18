import { Hand } from "./hand.js";

/**
 * Represents a player in the game.
 */
export class Player {
  #name;
  #hand;
  #color;

  /**
   * Creates a player with a display name and optional color tag.
   * @param {string} name - The player's display name.
   * @param {Object} game - The game definition object.
   * @param {string} [color] - Optional color tag for the player.
   * @throws {TypeError} If name or game are invalid.
   */
  constructor(name, game, color) {
    this.#name = Player.#validateName(name);
    const validatedGame = Player.#validateGame(game);

    this.#hand = new Hand(validatedGame.lines);
    this.#color = Player.#validateColor(color);
  }

  /**
   * Gets the player's name.
   * @returns {string} The player's name.
   */
  get name() {
    return this.#name;
  }

  /**
   * Gets the color assigned to the player, if any.
   * @returns {string|null} The player's color or null if not set.
   */
  get color() {
    return this.#color;
  }

  /**
   * Gets the hand associated with the player.
   * @returns {Hand} The player's hand instance.
   */
  get hand() {
    return this.#hand;
  }

  /**
   * Validates the player name.
   * @param {string} name - The name to validate.
   * @returns {string} The trimmed and validated name.
   * @throws {TypeError} If name is invalid.
   * @private
   */
  static #validateName(name) {
    if (typeof name !== "string") {
      throw new TypeError("Player name must be a string");
    }

    const trimmedName = name.trim();
    if (!trimmedName) {
      throw new TypeError("Player name must not be empty");
    }

    return trimmedName;
  }

  /**
   * Validates the game definition object.
   * @param {Object} game - The game definition to validate.
   * @returns {Object} The validated game object.
   * @throws {TypeError} If game is invalid.
   * @private
   */
  static #validateGame(game) {
    if (!game || typeof game !== "object") {
      throw new TypeError("Player requires a game definition object");
    }

    const { lines } = game;

    if (!Number.isInteger(lines) || lines < 1) {
      throw new TypeError("Player requires the game to expose lines");
    }

    return game;
  }

  /**
   * Validates the player color.
   * @param {string|undefined|null} color - The color to validate.
   * @returns {string|null} The validated color or null if not provided.
   * @throws {TypeError} If color is invalid.
   * @private
   */
  static #validateColor(color) {
    if (color === undefined || color === null) {
      return null;
    }

    if (typeof color !== "string") {
      throw new TypeError("Player color must be a string");
    }

    const trimmed = color.trim();

    if (!trimmed) {
      throw new TypeError("Player color must not be empty");
    }

    return trimmed;
  }
}
