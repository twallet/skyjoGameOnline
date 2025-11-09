// Represents the base configuration of a card game.
export class Game {
  #name;
  #values;
  #quantities;
  #handsize;
  #lines;
  #minPlayers;
  #maxPlayers;

  /**
   * Create a new game configuration.
   * @param {string} name Display name of the game.
   * @param {number[]} possibleValues Numeric values available for the deck.
   * @param {number[]} quantities Amount of cards per value.
   * @param {number} handsize Initial hand size for each player.
   * @param {number} lines Lines to divide the hand.
   * @param {number} minPlayers Minimum number of players.
   * @param {number} maxPlayers Maximum number of players.
   */
  constructor(name, possibleValues, quantities, handsize, lines, min, max) {
    this.#name = Game.#validateName(name);
    this.#values = Game.#validateValues(possibleValues);
    this.#quantities = Game.#validateQuantities(
      quantities,
      this.#values.length
    );
    this.#handsize = Game.#validateHandsize(handsize);
    this.#lines = Game.#validateLines(lines);
    this.#minPlayers = Game.#validateMin(min);
    this.#maxPlayers = Game.#validateMax(max, this.#minPlayers);
  }

  // Return the public name of the game.
  get name() {
    return this.#name;
  }

  // Provide the numeric values available in the deck.
  get values() {
    return [...this.#values];
  }

  // Provide the amount of cards per numeric value.
  get quantities() {
    return [...this.#quantities];
  }

  // Return the initial hand size per player.
  get handsize() {
    return this.#handsize;
  }

  // Return the hand lines.
  get lines() {
    return this.#lines;
  }

  // Return the minimum amount of players.
  get minPlayers() {
    return this.#minPlayers;
  }

  // Preserve backwards compatibility with legacy min getter.
  get min() {
    return this.#minPlayers;
  }

  // Return the maximum amount of players.
  get maxPlayers() {
    return this.#maxPlayers;
  }

  // Preserve backwards compatibility with legacy max getter.
  get max() {
    return this.#maxPlayers;
  }

  static #validateName(name) {
    if (typeof name !== "string") {
      throw new TypeError("Game name must be a string");
    }

    const trimmed = name.trim();
    if (!trimmed) {
      throw new TypeError("Game name must not be empty");
    }

    return trimmed;
  }

  static #validateValues(values) {
    if (!Array.isArray(values) || values.length === 0) {
      throw new TypeError("Game values must be a non-empty array of numbers");
    }

    const validated = values.map((value) => {
      if (typeof value !== "number" || !Number.isFinite(value)) {
        throw new TypeError("Game values must be finite numbers");
      }
      return value;
    });

    return validated;
  }

  static #validateQuantities(quantities, expectedLength) {
    if (!Array.isArray(quantities) || quantities.length !== expectedLength) {
      throw new TypeError("Game quantities must match the length of values");
    }

    const validated = quantities.map((quantity) => {
      if (!Number.isInteger(quantity) || quantity < 0) {
        throw new TypeError("Game quantities must be non-negative integers");
      }
      return quantity;
    });

    return validated;
  }

  static #validateHandsize(handsize) {
    if (!Number.isInteger(handsize) || handsize < 1) {
      throw new TypeError("Game handsize must be a positive integer");
    }

    return handsize;
  }

  static #validateLines(lines) {
    if (!Number.isInteger(lines) || lines < 1) {
      throw new TypeError("Game lines must be a positive integer");
    }

    return lines;
  }

  static #validateMin(min) {
    if (!Number.isInteger(min) || min < 1) {
      throw new TypeError("Game min players must be a positive integer");
    }

    return min;
  }

  static #validateMax(max, min) {
    if (!Number.isInteger(max) || max < 1) {
      throw new TypeError("Game max players must be a positive integer");
    }

    if (max < min) {
      throw new TypeError(
        "Game max players must be greater than or equal to min players"
      );
    }

    return max;
  }
}
