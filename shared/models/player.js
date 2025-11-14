import { Hand } from "./hand.js";

export class Player {
  #name;
  #hand;
  #color;

  // Create a player with a display name and optional color tag.
  constructor(name, game, color) {
    this.#name = Player.#validateName(name);
    const validatedGame = Player.#validateGame(game);

    this.#hand = new Hand(validatedGame.lines);
    this.#color = Player.#validateColor(color);
  }

  // Return the player's name.
  get name() {
    return this.#name;
  }

  // Return the color assigned to the player, if any.
  get color() {
    return this.#color;
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

  static #validateColor(color) {
    if (color === undefined || color === null) {
      return null;
    }

    if (typeof color !== "string") {
      throw new TypeError("Player color must be a string");
    }

    const trimmed = color.trim();

    if (!trimmed) {
      throw new TypeError("Player color must not be empty");
    }

    return trimmed;
  }
}
