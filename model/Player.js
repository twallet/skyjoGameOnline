import { Hand } from "./hand.js";

export class Player {
  #name;
  #hand;
  #game;

  // Create a player with a display name and an empty hand.
  constructor(name, game, hand) {
    this.#name = Player.#validateName(name);
    this.#game = Player.#validateGame(game);
    this.#hand = Player.#validateHand(
      hand !== undefined ? hand : new Hand(this.#game.lines)
    );
  }

  // Return the player's name.
  get name() {
    return this.#name;
  }

  // Return the game configuration associated with the player.
  get game() {
    return this.#game;
  }

  // Provide access to the hand associated with the player.
  get hand() {
    return this.#hand;
  }

  static #validateName(name) {
    if (typeof name !== "string") {
      throw new TypeError("Player name must be a string");
    }

    const trimmedName = name.trim();
    if (!trimmedName) {
      throw new TypeError("Player name must not be empty");
    }

    return trimmedName;
  }

  static #validateGame(game) {
    if (!game || typeof game !== "object") {
      throw new TypeError("Player requires a game definition object");
    }

    const { lines } = game;

    if (!Number.isInteger(lines) || lines < 1) {
      throw new TypeError("Player requires the game to expose lines");
    }

    return game;
  }

  static #validateHand(hand) {
    if (!(hand instanceof Hand)) {
      throw new TypeError("Player hand must be a Hand instance");
    }

    return hand;
  }
}
