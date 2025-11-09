import { Deck } from "../model/Deck.js";
import { Dealer } from "../model/Dealer.js";
import { Player } from "../model/Player.js";
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
var tom = new Player("Tom");
var vero = new Player("Vero");
var theo = new Player("Theo");
var dealer = new Dealer(SKYJO, [tom, vero, theo]);
dealer.shuffle();
dealer.deal();
