import { Card } from "./card.js";

export class Deck {
  #cards;

  // Build and return a complete deck that mirrors the game's definition.
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

  // Initialize an empty deck ready to receive cards.
  constructor() {
    this.#cards = [];
  }

  // Return a shallow copy of the internal cards for inspection.
  get cardsDeck() {
    return [...this.#cards];
  }

  // Place a validated card on top of the deck.
  add(card) {
    if (!(card instanceof Card)) {
      throw new TypeError("Deck only accepts Card instances");
    }

    this.#cards.push(card);
  }

  // Remove and return the top card of the deck.
  dealNextCard() {
    if (this.#cards.length === 0) {
      throw new Error("Cannot deal from an empty deck");
    }

    return this.#cards.pop();
  }

  // Provide a string summary showing deck size and card order.
  show() {
    return (
      "[" +
      this.#cards.map((card) => card.value).join(",") +
      "] (" +
      this.#cards.length +
      " cards)"
    );
  }

  // Randomize card order in place using Fisher-Yates.
  shuffle() {
    for (let k = this.#cards.length - 1; k >= 1; k--) {
      const randomIndex = Math.floor(Math.random() * k);
      const tempCard = this.#cards[randomIndex];
      this.#cards[randomIndex] = this.#cards[k];
      this.#cards[k] = tempCard;
    }
  }

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
