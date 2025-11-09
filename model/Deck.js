import { Card } from "./card.js";

export class Deck {
  // Build and return a complete deck matching the game's card distribution.
  static generateDeck(game) {
    var deck = new Deck(game);
    for (let i = 0; i < game.values.length; i++) {
      for (let j = 0; j < game.quantities[i]; j++) {
        deck.add(new Card(game.values[i], game));
      }
    }
    return deck;
  }

  // Initialize an empty deck ready to receive cards.
  constructor() {
    this._deck = [];
  }

  // Expose the raw array of cards (used mostly for diagnostics).
  get cardsDeck() {
    return this._deck;
  }

  // Place a card on top of the deck.
  add(card) {
    this._deck.push(card);
  }

  // Remove and return the top card of the deck.
  dealNextCard() {
    return this._deck.pop();
  }

  // Provide a string summary showing deck size and card order.
  show() {
    return (
      "(" +
      this._deck.length +
      " cards) [" +
      this._deck.map((card) => card.value).join(",") +
      "]"
    );
  }

  // Randomize card order in place using Fisher-Yates.
  shuffle() {
    for (let k = this._deck.length - 1; k >= 1; k--) {
      let az = Math.floor(Math.random() * k);
      let tempCard = this._deck[az];
      this._deck[az] = this._deck[k];
      this._deck[k] = tempCard;
    }
  }
}
