import { Hand } from "./hand.js";

export class Player {
  #name;
  #hand;

  // Create a player with a display name and an empty hand.
  constructor(name, { hand } = {}) {
    this.#name = Player.#validateName(name);
    this.#hand = Player.#validateHand(hand ?? new Hand());
  }

  // Return the player's name.
  get name() {
    return this.#name;
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

  static #validateHand(hand) {
    if (!(hand instanceof Hand)) {
      throw new TypeError("Player hand must be a Hand instance");
    }

    return hand;
  }
}
