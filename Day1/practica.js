/* Ejercicio 1 - Crear cartas con funciones flecha y variables
Define una función flecha para crear una carta con un valor dado. La función debe devolver un objeto que represente la carta con su valor. */

import { Deck } from "../model/Deck.js";
import { Card } from "../model/Card.js";
import { Dealer } from "../model/Dealer.js";
import { SKYJO } from "../model/Dealer.js";

console.log("################# EJERCICIO 1 #################");
let createCard = (value) => new Card(value);
var card5 = createCard(5);
console.log("Card value: " + card5.value);

/*Ejercicio 2 - Definir el mazo básico usando let y const
Define una constante mazo como un array vacío. Luego, usando una variable cantidadCartas, agrega al mazo cartas con un valor específico según las reglas del juego. Usa un ciclo para agregar varias cartas.*/

console.log("################# EJERCICIO 2 #################");
var deck = Deck.generateDeck(SKYJO);
console.log("Deck length: " + deck.cardsDeck.length);
console.log("Deck cards: [" + deck.show() + "]");

/* Ejercicio 3 - Uso de operadores para validar cartas válidas
Escribe una función flecha que reciba una carta y devuelva true si su valor está dentro del rango válido para las cartas de Skyjo (por ejemplo, entre -2 y 12), o false si no. */

console.log("################# EJERCICIO 3 #################");
var validCard = (card) => {
  return SKYJO.values.includes(card.value);
};
var card8 = new Card(8);
var card15 = new Card(15);
console.log("8: " + validCard(card8));
console.log("15: " + validCard(card15));

/* Ejercicio 4 - Combinar operadores y condicionales
Escribe una función que reciba una carta y clasifique su valor devolviendo:

- "negativa" si el valor es menor a 0
- "cero" si el valor es 0
- "positiva" si el valor es mayor a 0
*/

console.log("################# EJERCICIO 4 #################");
function evaluate(card) {
  if (card.value < 0) return "Negativa";
  if (card.value == 0) return "Cero";
  if (card.value > 0) return "Positiva";
  throw new Error("Unknown card value.");
}
var cardMinus2 = new Card(-2);
var card0 = new Card(0);
console.log("0: " + evaluate(card0));
console.log("-2: " + evaluate(cardMinus2));
console.log("8: " + evaluate(card8));
