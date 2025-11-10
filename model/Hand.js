import { Card } from "./card.js";

export class Hand {
  #cards;
  #lines;

  // Initialize a hand with an empty set of cards.
  constructor(lines = 1) {
    this.#cards = [];
    this.#lines = Hand.#validateLines(lines);
  }

  // Add a card to the hand.
  add(card) {
    this.#cards.push(this.#validateCard(card));
  }

  // Return an array with the numeric values of the cards in hand.
  cards() {
    return this.#cards.map((card) => card.value);
  }

  // Return a string summarizing the hand content.
  show() {
    const cardValues = this.cards();
    const rows = [];
    for (let start = 0; start < cardValues.length; start += this.#lines) {
      rows.push(cardValues.slice(start, start + this.#lines));
    }

    const matrix = `[${rows.map((row) => `[${row.join(", ")}]`).join(", ")}]`;

    return `(${this.size} cards) ${matrix}`;
  }

  // Provide card display data arranged according to the configured lines.
  cardsMatrix() {
    const rows = [];
    for (let start = 0; start < this.#cards.length; start += this.#lines) {
      const slice = this.#cards.slice(start, start + this.#lines);
      rows.push(
        slice.map((card) => ({
          value: card.value,
          image: card.image,
        }))
      );
    }

    return rows;
  }

  // Getter exposing the current size of the hand.
  get size() {
    return this.#cards.length;
  }

  // Getter exposing the configured number of lines.
  get lines() {
    return this.#lines;
  }

  // Ensure the provided value is a Card instance.
  #validateCard(card) {
    if (!(card instanceof Card)) {
      throw new TypeError("Hand can only store card objects");
    }
    return card;
  }

  // Ensure the provided value is a positive integer.
  static #validateLines(lines) {
    if (!Number.isInteger(lines) || lines < 1) {
      throw new TypeError("Hand lines must be a positive integer");
    }

    return lines;
  }
}
