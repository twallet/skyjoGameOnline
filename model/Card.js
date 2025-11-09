/**
 * Immutable numeric card tied to a specific game definition.
 */
export class Card {
  #value;

  constructor(value, game) {
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

    this.#value = value;
    Object.freeze(this);
  }

  get value() {
    return this.#value;
  }
}
