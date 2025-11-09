import { Hand } from "./Hand.js";

export class Player {
  constructor(name) {
    this._name = name;
    this._hand = new Hand();
  }

  get name() {
    return this._name;
  }

  get hand() {
    return this._hand;
  }
}
