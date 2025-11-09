import { Player } from "./Player.js";
import { Deck } from "./Deck.js";

export class Dealer {
  constructor(game, players) {
    this._players = players;
    this._deck = new Deck(game);
    console.log("Starting " + game.name + "...");
    let playersNames = "";
    playersNames = players.map((player) => player.name).join(", ");
    console.log("We have " + players.length + " players: " + playersNames);
  }

  get players() {
    return this._players;
  }

  deal(cardsNumber) {
    for (let n = 0; n < cardsNumber; n++) {
      for (let p = 0; p < this._players.length; p++) {
        this._players[p].push(this._deck.dealNextCard());
      }
    }
  }

  shuffle() {
    this._deck.shuffle();
  }
}
