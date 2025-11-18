// Represents the base configuration of a card game.
export class Game {
  #name;
  #values;
  #quantities;
  #images;
  #backImage;
  #handsize;
  #lines;
  #minPlayers;
  #maxPlayers;

  /**
   * Create a new game configuration.
   * @param {string} name Display name of the game.
   * @param {number[]} possibleValues Numeric values available for the deck.
   * @param {number[]} quantities Amount of cards per value.
   * @param {string[]} images Card images asociated to its value.
   * @param {string} backImage Card back image.
   * @param {number} handsize Initial hand size for each player.
   * @param {number} lines Lines to divide the hand.
   * @param {number} minPlayers Minimum number of players.
   * @param {number} maxPlayers Maximum number of players.
   */
  constructor(
    name,
    possibleValues,
    quantities,
    images,
    backImage,
    handsize,
    lines,
    min,
    max
  ) {
    this.#name = Game.#validateName(name);
    this.#values = Game.#validateValues(possibleValues);
    this.#quantities = Game.#validateQuantities(
      quantities,
      this.#values.length
    );
    this.#images = Game.#validateImages(images, this.#values.length);
    this.#backImage = Game.#validateBackImage(backImage);
    this.#handsize = Game.#validateHandsize(handsize);
    this.#lines = Game.#validateLines(lines);
    this.#minPlayers = Game.#validateMin(min);
    this.#maxPlayers = Game.#validateMax(max, this.#minPlayers);
  }

  /**
   * Gets the public name of the game.
   * @returns {string} The game name.
   */
  get name() {
    return this.#name;
  }

  /**
   * Gets a defensive copy of the numeric values available in the deck.
   * @returns {number[]} Array of card values.
   */
  get values() {
    return [...this.#values];
  }

  /**
   * Gets a defensive copy of the amount of cards per numeric value.
   * @returns {number[]} Array of card quantities.
   */
  get quantities() {
    return [...this.#quantities];
  }

  /**
   * Gets a defensive copy of the card images.
   * @returns {string[]} Array of image paths.
   */
  get images() {
    return [...this.#images];
  }

  /**
   * Gets the initial hand size per player.
   * @returns {number} The number of cards per hand.
   */
  get handsize() {
    return this.#handsize;
  }

  /**
   * Gets the number of hand lines (columns).
   * @returns {number} The number of columns.
   */
  get lines() {
    return this.#lines;
  }

  /**
   * Gets the minimum amount of players required.
   * @returns {number} The minimum number of players.
   */
  get minPlayers() {
    return this.#minPlayers;
  }

  /**
   * Gets the minimum amount of players (legacy alias for minPlayers).
   * @returns {number} The minimum number of players.
   */
  get min() {
    return this.#minPlayers;
  }

  /**
   * Gets the maximum amount of players allowed.
   * @returns {number} The maximum number of players.
   */
  get maxPlayers() {
    return this.#maxPlayers;
  }

  /**
   * Gets the maximum amount of players (legacy alias for maxPlayers).
   * @returns {number} The maximum number of players.
   */
  get max() {
    return this.#maxPlayers;
  }

  /**
   * Gets the card back image path.
   * @returns {string} The back image path.
   */
  get backImage() {
    return this.#backImage;
  }

  /**
   * Returns the image path for the given card value.
   * @param {number} value - The card value to get the image for.
   * @returns {string} The image path for the card value.
   * @throws {Error} If no image exists for the given value.
   */
  imageFor(value) {
    const index = this.#values.indexOf(value);
    if (index === -1) {
      throw new Error(`No image exists for value: ${value}`);
    }
    return this.#images[index];
  }

  /**
   * Validates the game name.
   * @param {string} name - The name to validate.
   * @returns {string} The trimmed and validated name.
   * @throws {TypeError} If name is invalid.
   * @private
   */
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

  /**
   * Validates the card values array.
   * @param {number[]} values - The values array to validate.
   * @returns {number[]} The validated values array.
   * @throws {TypeError} If values are invalid.
   * @private
   */
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

  /**
   * Validates the card quantities array.
   * @param {number[]} quantities - The quantities array to validate.
   * @param {number} expectedLength - The expected length matching values array.
   * @returns {number[]} The validated quantities array.
   * @throws {TypeError} If quantities are invalid.
   * @private
   */
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

  /**
   * Validates the card images array.
   * @param {string[]} images - The images array to validate.
   * @param {number} expectedLength - The expected length matching values array.
   * @returns {string[]} The validated images array.
   * @throws {TypeError} If images are invalid.
   * @private
   */
  static #validateImages(images, expectedLength) {
    if (!Array.isArray(images) || images.length !== expectedLength) {
      throw new TypeError("Card images paths must match the length of values");
    }

    const validated = images.map((imagePath, index) =>
      Game.#validateImagePath(imagePath, `Card image path at index ${index}`)
    );

    return validated;
  }

  /**
   * Validates the card back image path.
   * @param {string} backImage - The back image path to validate.
   * @returns {string} The validated back image path.
   * @throws {TypeError} If back image is invalid.
   * @private
   */
  static #validateBackImage(backImage) {
    return Game.#validateImagePath(backImage, "Card back image path");
  }

  /**
   * Validates an image path.
   * @param {string} imagePath - The image path to validate.
   * @param {string} label - Label for error messages.
   * @returns {string} The validated and trimmed image path.
   * @throws {TypeError} If image path is invalid.
   * @private
   */
  static #validateImagePath(imagePath, label) {
    if (typeof imagePath !== "string") {
      throw new TypeError(`${label} must be a string`);
    }

    const trimmed = imagePath.trim();
    if (!trimmed) {
      throw new TypeError(`${label} must not be empty`);
    }

    const isValidImage = /\.(png|jpe?g|gif|svg|webp)$/i.test(trimmed);
    if (!isValidImage) {
      throw new TypeError(`${label} must point to a supported image file`);
    }

    return trimmed;
  }

  /**
   * Validates the hand size.
   * @param {number} handsize - The hand size to validate.
   * @returns {number} The validated hand size.
   * @throws {TypeError} If handsize is invalid.
   * @private
   */
  static #validateHandsize(handsize) {
    if (!Number.isInteger(handsize) || handsize < 1) {
      throw new TypeError("Game handsize must be a positive integer");
    }

    return handsize;
  }

  /**
   * Validates the number of lines (columns).
   * @param {number} lines - The number of lines to validate.
   * @returns {number} The validated number of lines.
   * @throws {TypeError} If lines is invalid.
   * @private
   */
  static #validateLines(lines) {
    if (!Number.isInteger(lines) || lines < 1) {
      throw new TypeError("Game lines must be a positive integer");
    }

    return lines;
  }

  /**
   * Validates the minimum number of players.
   * @param {number} min - The minimum number of players to validate.
   * @returns {number} The validated minimum number of players.
   * @throws {TypeError} If min is invalid.
   * @private
   */
  static #validateMin(min) {
    if (!Number.isInteger(min) || min < 1) {
      throw new TypeError("Game min players must be a positive integer");
    }

    return min;
  }

  /**
   * Validates the maximum number of players.
   * @param {number} max - The maximum number of players to validate.
   * @param {number} min - The minimum number of players for comparison.
   * @returns {number} The validated maximum number of players.
   * @throws {TypeError} If max is invalid or less than min.
   * @private
   */
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
