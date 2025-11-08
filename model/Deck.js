import { Card } from "./Card.js";

export class Deck {
  static generateDeck(game) {
    var deck = new Deck(game);
    for (let i = 0; i < game.values.length; i++) {
      for (let j = 0; j < game.quantities[i]; j++) {
        deck.addCard(new Card(game.values[i]));
      }
    }
    return deck;
  }

  constructor(game) {
    this._deck = [];
    this._game = game;
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

  countCards() {
    let countText = "";
    this._game.values.forEach(
      (value) =>
        (countText +=
          "Value " +
          value +
          ": " +
          this._deck.filter((card) => card.value == value).length +
          " cards\n")
    );
    return countText;
  }
}
