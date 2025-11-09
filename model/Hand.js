export class Hand {
  // Initialize an empty hand for cards drawn during play.
  constructor() {
    this._cards = [];
  }

  // Store a new card in the hand.
  add(card) {
    this._cards.push(card);
  }

  // Return a string summarizing card count and values in the hand.
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
