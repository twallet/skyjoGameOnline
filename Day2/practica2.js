import { Deck } from "../model/Deck.js";
import { Card } from "../model/Card.js";
import { SKYJO } from "../model/Dealer.js";

console.log("################# EJERCICIO Shuffle #################");
var deck = Deck.generateDeck(SKYJO);
console.log("Deck length: " + deck.cardsDeck.length);
console.log("Deck cards: [" + deck.show() + "]");
console.log(deck.countCards());
deck.shuffle();
console.log("Deck length: " + deck.cardsDeck.length);
console.log("Deck cards: [" + deck.show() + "]");
console.log(deck.countCards());
