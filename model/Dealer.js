import { Deck } from "./deck.js";
import { Player } from "./player.js";

export class Dealer {
  #game;
  #players;
  #deck;
  #handSize;

  // Create a dealer that manages the deck and players for the provided game.
  constructor(game, players) {
    this.#game = Dealer.#validateGame(game);
    this.#players = Dealer.#validatePlayers(players);
    this.#handSize = Dealer.#resolveHandSize(this.#game);
    this.#deck = Deck.generateDeck(this.#game);

    Dealer.#announceGame(this.#game, this.#players);
  }

  // Expose the players currently managed by the dealer.
  get players() {
    return [...this.#players];
  }

  // Provide access to the deck controlled by the dealer.
  get deck() {
    return this.#deck;
  }

  // Return the configured hand size per player.
  get handSize() {
    return this.#handSize;
  }

  // Shuffle the deck and log the new card order.
  shuffle() {
    this.#deck.shuffle();
    console.log("Deck shuffled: " + this.#deck.show());
  }

  // Deal the required number of cards to each player and log the resulting hands.
  deal() {
    for (let n = 0; n < this.#handSize; n++) {
      for (let p = 0; p < this.#players.length; p++) {
        this.#players[p].hand.add(this.#deck.dealNextCard());
      }
    }

    for (let p = 0; p < this.#players.length; p++) {
      console.log(
        `${this.#players[p].name}'s hand: ${this.#players[p].hand.show()}`
      );
    }
  }

  static #validateGame(game) {
    if (!game || typeof game !== "object") {
      throw new TypeError("Dealer requires a game definition object");
    }

    if (typeof game.name !== "string") {
      throw new TypeError("Dealer requires the game to expose a name");
    }

    if (
      typeof game.values === "undefined" ||
      typeof game.quantities === "undefined"
    ) {
      throw new TypeError(
        "Dealer requires the game to expose values and quantities"
      );
    }

    return game;
  }

  static #validatePlayers(players) {
    if (!Array.isArray(players) || players.length === 0) {
      throw new TypeError("Dealer requires at least one player");
    }

    players.forEach((player, index) => {
      if (!(player instanceof Player)) {
        throw new TypeError(
          `Dealer requires every player to be a Player instance (index ${index})`
        );
      }
    });

    return players;
  }

  static #resolveHandSize(game) {
    const handSize =
      typeof game.handsize === "number"
        ? game.handsize
        : typeof game.handSize === "number"
          ? game.handSize
          : null;

    if (!Number.isInteger(handSize) || handSize < 1) {
      throw new TypeError("Dealer requires the game to provide a hand size");
    }

    return handSize;
  }

  static #announceGame(game, players) {
    console.log(`Starting ${game.name}...`);
    console.log(
      `We have ${players.length} players: ${players
        .map((player) => player.name)
        .join(", ")}`
    );
  }
}
