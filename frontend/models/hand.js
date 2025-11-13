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

  get matrix() {
    return this.cardsMatrix();
  }

  get columns() {
    return this.#lines;
  }

  get rows() {
    if (this.#lines <= 0) {
      return 0;
    }
    return Math.floor(this.#cards.length / this.#lines);
  }

  revealCard(position) {
    const card = this.#getCardAt(position);

    if (card.value !== "X") {
      throw new Error("Card is already visible");
    }

    card.visible = true;
    return {
      value: card.value,
      image: card.image,
    };
  }

  isCardVisible(position) {
    const card = this.#getCardAt(position);
    return card.value !== "X";
  }

  replaceCard(position, replacement) {
    const card = this.#getCardAt(position);
    const nextCard = this.#validateCard(replacement);
    this.#cards[position] = nextCard;
    return card;
  }

  removeColumn(columnIndex) {
    if (!Number.isInteger(columnIndex)) {
      throw new TypeError("Column index must be an integer");
    }

    if (columnIndex < 0 || columnIndex >= this.#lines) {
      throw new RangeError("Column index out of bounds");
    }

    const rowCount = this.rows;
    if (rowCount === 0) {
      return [];
    }

    const removedCards = [];
    const nextCards = [];

    for (let row = 0; row < rowCount; row += 1) {
      const rowStart = row * this.#lines;
      for (let column = 0; column < this.#lines; column += 1) {
        const index = rowStart + column;
        const card = this.#cards[index];
        if (column === columnIndex) {
          removedCards.push(card);
        } else {
          nextCards.push(card);
        }
      }
    }

    this.#cards = nextCards;
    const nextLines = this.#lines - 1;
    this.#lines = nextLines > 0 ? nextLines : 1;

    return removedCards;
  }

  allCardsVisible() {
    return this.#cards.every((card) => card.value !== "X");
  }

  #getCardAt(position) {
    if (!Number.isInteger(position)) {
      throw new TypeError("Hand card position must be an integer");
    }

    if (position < 0 || position >= this.#cards.length) {
      throw new RangeError("Hand card position out of bounds");
    }

    return this.#cards[position];
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
