import { Player } from "./Player.js";
import { Deck } from "./Deck.js";
import { Hand } from "./Hand.js";

export class Dealer {
  constructor(game, players) {
    this._players = players;
    this._deck = Deck.generateDeck(game);
    this._game = game;
    console.log("Starting " + game.name + "...");
    let playersNames = "";
    playersNames = players.map((player) => player.name).join(", ");
    console.log("We have " + players.length + " players: " + playersNames);
  }

  get players() {
    return this._players;
  }

  get deck() {
    return this._deck;
  }

  shuffle() {
    this._deck.shuffle();
    console.log("Deck shuffled: " + this._deck.show());
  }

  deal() {
    for (let n = 0; n < this._game.handSize; n++) {
      for (let p = 0; p < this._players.length; p++) {
        this._players[p].hand.add(this._deck.dealNextCard());
      }
    }
    for (let p = 0; p < this._players.length; p++) {
      console.log(
        "" + this._players[p].name + "'s hand: " + this._players[p].hand.show()
      );
    }
  }
}
