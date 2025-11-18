/**
 * Immutable numeric card tied to a specific game definition.
 */
export class Card {
  #value;
  #image;
  #backImage;
  #visible;

  /**
   * Creates a new card instance.
   * @param {number} value - The numeric value of the card.
   * @param {Object} game - The game definition object.
   * @throws {Error} If value is invalid or game definition is missing.
   */
  constructor(value, game) {
    Card.#validate(value, game);

    this.#value = value;
    this.#visible = false;
    this.#image = game.imageFor(value);
    const backImage =
      typeof game.backImage === "function" ? game.backImage() : game.backImage;
    this.#backImage = backImage;
  }

  /**
   * Gets the card value. Returns "X" if the card is hidden.
   * @returns {number|string} The card value or "X" if hidden.
   */
  get value() {
    return this.#visible ? this.#value : "X";
  }

  /**
   * Gets the card image. Returns the back image if the card is hidden.
   * @returns {string} The card image path.
   */
  get image() {
    return this.#visible ? this.#image : this.#backImage;
  }

  /**
   * Sets the visibility of the card.
   * @param {boolean} visibility - Whether the card should be visible.
   * @throws {TypeError} If visibility is not a boolean.
   */
  set visible(visibility) {
    if (typeof visibility !== "boolean") {
      throw new TypeError("Card visibility must be a boolean");
    }

    this.#visible = visibility;
  }

  /**
   * Validates card value and game definition.
   * @param {number} value - The card value to validate.
   * @param {Object} game - The game definition to validate.
   * @throws {Error} If validation fails.
   * @private
   */
  static #validate(value, game) {
    if (value === null || value === undefined) {
      throw new Error("Card value must not be null or undefined");
    }

    if (!game || typeof game !== "object") {
      throw new Error("Card requires a game definition");
    }

    if (!Array.isArray(game.values)) {
      throw new Error("Game definition must provide a values array");
    }

    if (!game.values.includes(value)) {
      throw new Error("Card value not available in the game: " + game.name);
    }
  }
}
