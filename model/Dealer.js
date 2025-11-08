import { Card } from "./Card.js";
import { Deck } from "./Deck.js";
import { SKYJO } from "../games/skyjo.js";

export class Dealer {
  constructor(players) {
    this._players = Array.from({ length: players }, () => []);
    this._deck = new Deck(SKYJO);
  }

  deal(cardsNumber) {
    for (let n = 0; n < cardsNumber; n++) {
      for (let p = 0; p < this._players.length; p++) {
        this._players[p].push(this._deck.dealNextCard());
      }
    }
  }
}
