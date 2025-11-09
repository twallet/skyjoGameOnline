export class Hand {
  constructor() {
    this._cards = [];
  }

  add(card) {
    this._cards.push(card);
  }

  show() {
    return (
      "(" +
      this._cards.length +
      " cards) [" +
      this._cards.map((card) => card.value).join(",") +
      "]"
    );
  }
}
