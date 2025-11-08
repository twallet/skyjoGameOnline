import { Card } from "./Card.js";
import { Deck } from "./Deck.js";

export const SKYJO = {
  values: [-2, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
  quantities: [5, 10, 15, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10],
};

export class Dealer {
  constructor(players) {
    this._players = [];
    this._deck = new Deck(SKYJO);
  }
}
