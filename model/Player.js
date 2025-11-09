import { Hand } from "./hand.js";

export class Player {
  // Create a player with a display name and an empty hand.
  constructor(name) {
    this._name = name;
    this._hand = new Hand();
  }

  // Return the player's name.
  get name() {
    return this._name;
  }

  // Provide access to the hand associated with the player.
  get hand() {
    return this._hand;
  }
}
