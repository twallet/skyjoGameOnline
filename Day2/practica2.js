import { Dealer } from "../model/dealer.js";
import { Player } from "../model/player.js";
import { SKYJO } from "../games/skyjo.js";

/*
console.log("################# EJERCICIO Shuffle #################");
var deck = Deck.generateDeck(SKYJO);
console.log("Deck length: " + deck.cardsDeck.length);
console.log("Deck cards: [" + deck.show() + "]");
console.log(deck.countCards());
deck.shuffle();
console.log("Deck length: " + deck.cardsDeck.length);
console.log("Deck cards: [" + deck.show() + "]");
console.log(deck.countCards());
*/

console.log("################# EJERCICIO Deal #################");
var tom = new Player("Tom", SKYJO);
var vero = new Player("Vero", SKYJO);
var theo = new Player("Theo", SKYJO);
var merlin = new Player("Merlin", SKYJO);
var hugo = new Player("Hugo", SKYJO);
var dealer = new Dealer(SKYJO, [tom, vero, theo, hugo, merlin]);
dealer.shuffle();
dealer.deal();
console.log("Deck: " + dealer.deck.show());
