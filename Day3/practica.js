import { Game } from "../model/game.js";
import { Player } from "../model/player.js";
import { Dealer } from "../model/dealer.js";

const skyjo = new Game(
  "Skyjo",
  [-2, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
  [5, 10, 15, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10],
  12,
  4
);

var tom = new Player("Tom", skyjo);
var vero = new Player("Vero", skyjo);
var theo = new Player("Theo", skyjo);
var merlin = new Player("Merlin", skyjo);
var hugo = new Player("Hugo", skyjo);
var dealer = new Dealer(skyjo, [tom, vero, theo, hugo, merlin]);
dealer.shuffle();
dealer.deal();
console.log(`Remaining deck: ${dealer.deck.size()} cards`);
