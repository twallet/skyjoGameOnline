import { Deck } from "./deck.js";
import { Player } from "./player.js";

/**
 * Manages deck and player distribution for a card game.
 */
export class Dealer {
  #game;
  #players;
  #deck;
  #handSize;

  /**
   * Creates a dealer that manages the deck and players for the provided game.
   * @param {Object} game - The game definition object.
   * @param {Player[]} players - Array of player instances.
   * @throws {TypeError} If game or players are invalid.
   */
  constructor(game, players) {
    this.#game = Dealer.#validateGame(game);
    this.#players = Dealer.#validatePlayers(players);
    this.#handSize = Dealer.#resolveHandSize(this.#game);
    this.#deck = Deck.generateDeck(this.#game);
  }

  /**
   * Gets a defensive copy of the players currently managed by the dealer.
   * @returns {Player[]} Array of player instances.
   */
  get players() {
    return [...this.#players];
  }

  /**
   * Gets the deck controlled by the dealer.
   * @returns {Deck} The deck instance.
   */
  get deck() {
    return this.#deck;
  }

  /**
   * Gets the configured hand size per player.
   * @returns {number} The number of cards per hand.
   */
  get handSize() {
    return this.#handSize;
  }

  /**
   * Randomizes card order in place using Fisher-Yates shuffle algorithm.
   */
  shuffle() {
    const cards = this.#deck.getCardsForShuffling();
    for (let k = cards.length - 1; k >= 1; k--) {
      const randomIndex = Math.floor(Math.random() * k);
      const tempCard = cards[randomIndex];
      cards[randomIndex] = cards[k];
      cards[k] = tempCard;
    }
  }

  /**
   * Deals the required number of cards to each player.
   */
  deal() {
    for (let n = 0; n < this.#handSize; n++) {
      for (let p = 0; p < this.#players.length; p++) {
        this.#players[p].hand.add(this.#deck.dealNextCard());
      }
    }
  }

  /**
   * Validates the game definition object.
   * @param {Object} game - The game definition to validate.
   * @returns {Object} The validated game object.
   * @throws {TypeError} If game is invalid.
   * @private
   */
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

  /**
   * Validates the players array.
   * @param {Player[]} players - Array of player instances to validate.
   * @returns {Player[]} The validated players array.
   * @throws {TypeError} If players array is invalid.
   * @private
   */
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

  /**
   * Resolves the hand size from the game definition.
   * Supports both 'handsize' and 'handSize' properties for backwards compatibility.
   * @param {Object} game - The game definition object.
   * @returns {number} The hand size.
   * @throws {TypeError} If hand size is invalid or missing.
   * @private
   */
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
}
