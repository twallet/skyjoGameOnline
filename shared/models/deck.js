import { Card } from "./card.js";

/**
 * Represents a deck of cards for a card game.
 */
export class Deck {
  #cards;

  /**
   * Builds and returns a complete deck that mirrors the game's definition.
   * @param {Object} game - The game definition object.
   * @returns {Deck} A new deck instance with all cards.
   * @throws {TypeError} If game definition is invalid.
   */
  static generateDeck(game) {
    Deck.#validateGameDefinition(game);

    const deck = new Deck();

    for (let i = 0; i < game.values.length; i++) {
      for (let j = 0; j < game.quantities[i]; j++) {
        deck.add(new Card(game.values[i], game));
      }
    }

    return deck;
  }

  /**
   * Initializes an empty deck ready to receive cards.
   */
  constructor() {
    this.#cards = [];
  }

  /**
   * Gets a defensive copy of the internal cards for inspection.
   * @returns {Card[]} Array of card instances.
   */
  get cardsDeck() {
    return [...this.#cards];
  }

  /**
   * Places a validated card on top of the deck.
   * @param {Card} card - The card instance to add.
   * @throws {TypeError} If card is not a Card instance.
   */
  add(card) {
    if (!(card instanceof Card)) {
      throw new TypeError("Deck only accepts Card instances");
    }

    this.#cards.push(card);
  }

  /**
   * Removes and returns the top card of the deck.
   * @returns {Card} The card that was removed from the deck.
   * @throws {Error} If the deck is empty.
   */
  dealNextCard() {
    if (this.#cards.length === 0) {
      throw new Error("Cannot deal from an empty deck");
    }

    return this.#cards.pop();
  }

  /**
   * Gets the current size of the deck.
   * @returns {number} The number of cards in the deck.
   */
  size() {
    return this.#cards.length;
  }

  /**
   * Randomizes card order in place using Fisher-Yates shuffle algorithm.
   */
  shuffle() {
    for (let k = this.#cards.length - 1; k >= 1; k--) {
      const randomIndex = Math.floor(Math.random() * k);
      const tempCard = this.#cards[randomIndex];
      this.#cards[randomIndex] = this.#cards[k];
      this.#cards[k] = tempCard;
    }
  }

  /**
   * Makes the first card in the deck visible.
   * Does nothing if the deck is empty.
   */
  showFirstCard() {
    if (this.#cards.length === 0) {
      return;
    }

    this.#cards[0].visible = true;
  }

  /**
   * Validates the game definition object.
   * @param {Object} game - The game definition to validate.
   * @throws {TypeError} If game definition is invalid.
   * @private
   */
  static #validateGameDefinition(game) {
    if (!game || typeof game !== "object") {
      throw new TypeError("Deck requires a game definition object");
    }

    const { values, quantities } = game;

    if (!Array.isArray(values) || values.length === 0) {
      throw new TypeError("Deck requires the game to expose card values");
    }

    if (!Array.isArray(quantities) || quantities.length !== values.length) {
      throw new TypeError(
        "Deck requires card quantities matching the game values"
      );
    }

    const hasInvalidValue = values.some(
      (value) => typeof value !== "number" || !Number.isFinite(value)
    );
    if (hasInvalidValue) {
      throw new TypeError("Deck requires the game values to be finite numbers");
    }

    const hasInvalidQuantity = quantities.some(
      (quantity) => !Number.isInteger(quantity) || quantity < 0
    );
    if (hasInvalidQuantity) {
      throw new TypeError(
        "Deck requires the game quantities to be non-negative integers"
      );
    }
  }
}
