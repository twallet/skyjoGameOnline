export class Hand {
  constructor() {
    this._cards = [];
  }

  add(card) {
    this._cards.push(card);
  }
}
