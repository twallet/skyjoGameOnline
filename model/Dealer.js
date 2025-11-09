import { Deck } from "./deck.js";

export class Dealer {
  // Create a dealer that manages the deck and players for the provided game.
  constructor(game, players) {
    this._players = players;
    this._deck = Deck.generateDeck(game);
    this._game = game;
    console.log("Starting " + game.name + "...");
    console.log(
      "We have " +
        players.length +
        " players: " +
        players.map((player) => player.name).join(", ")
    );
  }

  // Expose the players currently managed by the dealer.
  get players() {
    return this._players;
  }

  // Provide access to the deck controlled by the dealer.
  get deck() {
    return this._deck;
  }

  // Shuffle the deck and log the new card order.
  shuffle() {
    this._deck.shuffle();
    console.log("Deck shuffled: " + this._deck.show());
  }

  // Deal the required number of cards to each player and log the resulting hands.
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
