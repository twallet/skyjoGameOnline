class Deck {
  static generateDeck(game) {
    var deck = new Deck();
    for (let i = 0; i < game.values.length; i++) {
      for (let j = 0; j < game.quantities[i]; j++) {
        deck.addCard(new Card(game.values[i]));
      }
    }
    return deck;
  }

  constructor() {
    this._deck = [];
  }

  get cardsDeck() {
    return this._deck;
  }

  addCard(card) {
    if (card instanceof Card) {
      this._deck.push(card);
    } else {
      throw new Error("Wrong type. Only Card objects can be added to deck.");
    }
  }

  show() {
    return this._deck.map((card) => card.value).join(",");
  }
}
