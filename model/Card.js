/**
 * Immutable numeric card tied to a specific game definition.
 */
export class Card {
  #value;
  #image;
  #backImage;
  #visible;

  constructor(value, game) {
    Card.#validate(value, game);

    this.#value = value;
    this.#visible = true;
    this.#image = game.imageFor(value);
    const backImage =
      typeof game.backImage === "function" ? game.backImage() : game.backImage;
    this.#backImage = backImage;
  }

  get value() {
    return this.#visible ? this.#value : "X";
  }

  get image() {
    return this.#visible ? this.#image : this.#backImage;
  }

  /**
   * @param {boolean} visibility
   */
  set visible(visibility) {
    if (typeof visibility !== "boolean") {
      throw new TypeError("Card visibility must be a boolean");
    }

    this.#visible = visibility;
  }

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
