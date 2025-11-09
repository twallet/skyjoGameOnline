import { Card } from "./card.js";

export class Hand {
  #cards;

  // Initialize a hand with an empty set of cards.
  constructor() {
    this.#cards = [];
  }

  // Add a card to the hand.
  add(card) {
    this.#cards.push(this.#validateCard(card));
  }

  // Return an array with the numeric values of the cards in hand.
  values() {
    return this.#cards.map((card) => card.value);
  }

  // Return a string summarizing the hand content.
  show() {
    return `(${this.size} cards) [${this.values().join(", ")}]`;
  }

  // Getter exposing the current size of the hand.
  get size() {
    return this.#cards.length;
  }

  // Ensure the provided value is a Card instance.
  #validateCard(card) {
    if (!(card instanceof Card)) {
      throw new TypeError("Hand can only store card objects");
    }
    return card;
  }
}
