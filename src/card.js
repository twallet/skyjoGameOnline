class Card {
  constructor(value) {
    this._cardValue = value;
  }

  get value() {
    return this._cardValue;
  }
}

module.exports = Card;
