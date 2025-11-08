import { Card } from "./Card.js";

export class Deck {
  static skyjo = {
    values: [-2, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    quantities: [5, 10, 15, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10],
  };

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

  shuffle() {
    for (let k = this._deck.length - 1; k >= 1; k--) {
      let az = Math.floor(Math.random() * k);
      let tempCard = this._deck[az];
      this._deck[az] = this._deck[k];
      this._deck[k] = tempCard;
    }
  }
}
