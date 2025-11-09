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
var merlin = new Player("Merlin");
var hugo = new Player("Hugo");
var dealer = new Dealer(SKYJO, [tom, vero, theo, merlin, hugo]);
dealer.shuffle();
dealer.deal();
console.log(dealer.deck.show());
