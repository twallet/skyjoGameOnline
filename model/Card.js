export class Card {
  // Represent an individual card with a numeric value.
  constructor(value) {
    this._cardValue = value;
  }

  // Return the numeric value assigned to the card.
  get value() {
    return this._cardValue;
  }
}
