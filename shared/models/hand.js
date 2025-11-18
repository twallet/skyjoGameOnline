import { Card } from "./card.js";

/**
 * Represents a player's hand of cards arranged in a matrix.
 */
export class Hand {
  #cards;
  #lines;

  /**
   * Initializes a hand with an empty set of cards.
   * @param {number} lines - Number of columns (lines) for card arrangement. Defaults to 1.
   * @throws {TypeError} If lines is not a positive integer.
   */
  constructor(lines = 1) {
    this.#cards = [];
    this.#lines = Hand.#validateLines(lines);
  }

  /**
   * Adds a card to the hand.
   * @param {Card} card - The card instance to add.
   * @throws {TypeError} If card is not a Card instance.
   */
  add(card) {
    this.#cards.push(this.#validateCard(card));
  }

  /**
   * Returns an array with the numeric values of the cards in hand.
   * Hidden cards are represented as "X".
   * @returns {Array<number|string>} Array of card values.
   */
  cards() {
    return this.#cards.map((card) => card.value);
  }

  /**
   * Returns a string summarizing the hand content.
   * @returns {string} A formatted string representation of the hand.
   */
  show() {
    const cardValues = this.cards();
    const rows = [];
    for (let start = 0; start < cardValues.length; start += this.#lines) {
      rows.push(cardValues.slice(start, start + this.#lines));
    }

    const matrix = `[${rows.map((row) => `[${row.join(", ")}]`).join(", ")}]`;

    return `(${this.size} cards) ${matrix}`;
  }

  /**
   * Provides card display data arranged according to the configured lines.
   * @returns {Array<Array<{value: number|string, image: string}>>} Matrix of card data organized by rows and columns.
   */
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

  /**
   * Gets the current size of the hand.
   * @returns {number} The number of cards in the hand.
   */
  get size() {
    return this.#cards.length;
  }

  /**
   * Gets the configured number of lines (columns).
   * @returns {number} The number of columns.
   */
  get lines() {
    return this.#lines;
  }

  /**
   * Gets the card matrix (alias for cardsMatrix()).
   * @returns {Array<Array<{value: number|string, image: string}>>} Matrix of card data.
   */
  get matrix() {
    return this.cardsMatrix();
  }

  /**
   * Gets the number of columns (alias for lines).
   * @returns {number} The number of columns.
   */
  get columns() {
    return this.#lines;
  }

  /**
   * Gets the number of rows in the hand matrix.
   * @returns {number} The number of rows.
   */
  get rows() {
    if (this.#lines <= 0) {
      return 0;
    }
    return Math.floor(this.#cards.length / this.#lines);
  }

  /**
   * Reveals a card at the specified position.
   * @param {number} position - The index of the card to reveal.
   * @returns {{value: number|string, image: string}} The revealed card data.
   * @throws {Error} If card is already visible or position is invalid.
   */
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

  /**
   * Checks if a card at the specified position is visible.
   * @param {number} position - The index of the card to check.
   * @returns {boolean} True if the card is visible, false otherwise.
   */
  isCardVisible(position) {
    const card = this.#getCardAt(position);
    return card.value !== "X";
  }

  /**
   * Replaces a card at the specified position with a new card.
   * @param {number} position - The index of the card to replace.
   * @param {Card} replacement - The new card instance.
   * @returns {Card} The card that was replaced.
   * @throws {TypeError} If replacement is not a Card instance or position is invalid.
   */
  replaceCard(position, replacement) {
    const card = this.#getCardAt(position);
    const nextCard = this.#validateCard(replacement);
    this.#cards[position] = nextCard;
    return card;
  }

  /**
   * Removes an entire column from the hand matrix.
   * @param {number} columnIndex - The index of the column to remove.
   * @returns {Card[]} Array of cards that were removed.
   * @throws {TypeError} If columnIndex is not an integer.
   * @throws {RangeError} If columnIndex is out of bounds.
   */
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

  /**
   * Checks if all cards in the hand are visible.
   * @returns {boolean} True if all cards are visible, false otherwise.
   */
  allCardsVisible() {
    return this.#cards.every((card) => card.value !== "X");
  }

  /**
   * Reveals all cards in the hand.
   */
  revealAllCards() {
    this.#cards.forEach((card) => {
      card.visible = true;
    });
  }

  /**
   * Gets the card at the specified position.
   * @param {number} position - The index of the card.
   * @returns {Card} The card instance.
   * @throws {TypeError} If position is not an integer.
   * @throws {RangeError} If position is out of bounds.
   * @private
   */
  #getCardAt(position) {
    if (!Number.isInteger(position)) {
      throw new TypeError("Hand card position must be an integer");
    }

    if (position < 0 || position >= this.#cards.length) {
      throw new RangeError("Hand card position out of bounds");
    }

    return this.#cards[position];
  }

  /**
   * Validates that the provided value is a Card instance.
   * @param {Card} card - The card to validate.
   * @returns {Card} The validated card instance.
   * @throws {TypeError} If card is not a Card instance.
   * @private
   */
  #validateCard(card) {
    if (!(card instanceof Card)) {
      throw new TypeError("Hand can only store card objects");
    }
    return card;
  }

  /**
   * Validates that the provided value is a positive integer.
   * @param {number} lines - The number of lines to validate.
   * @returns {number} The validated number of lines.
   * @throws {TypeError} If lines is not a positive integer.
   * @private
   */
  static #validateLines(lines) {
    if (!Number.isInteger(lines) || lines < 1) {
      throw new TypeError("Hand lines must be a positive integer");
    }

    return lines;
  }
}
