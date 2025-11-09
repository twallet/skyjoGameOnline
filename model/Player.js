import { Hand } from "./Hand.js";

export class Player {
  constructor(name) {
    this._name = name;
    this._hand = new Hand();
    console.log("Player created: " + name);
  }

  get name() {
    return this._name;
  }

  get hand() {
    return this._hand;
  }
}
