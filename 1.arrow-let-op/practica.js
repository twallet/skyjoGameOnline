/* Ejercicio 1 - Crear cartas con funciones flecha y variables
Define una función flecha para crear una carta con un valor dado. La función debe devolver un objeto que represente la carta con su valor. */

class Card {
  constructor(value) {
    this._cardValue = value;
  }

  get value() {
    return this._cardValue;
  }
}

let createCard = (value) => new Card(value);

var card5 = createCard(5);

console.log("Card value: " + card5.value);

/*Ejercicio 2 - Definir el mazo básico usando let y const
Define una constante mazo como un array vacío. Luego, usando una variable cantidadCartas, agrega al mazo cartas con un valor específico según las reglas del juego. Usa un ciclo para agregar varias cartas.*/

const SKYJO = {
  values: [-2, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
  quantities: [5, 10, 15, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10],
};

class Deck {
  static generateDeck(game) {
    var deck = new Deck();
    for (let i = 0; i < game.values.length; i++) {
      for (let j = 0; j < game.quantities[i]; j++) {
        deck.addCard(new Card(game.values[i]));
      }
    }
    return deck;
  }

  constructor() {
    this._deck = [];
  }

  get cardsDeck() {
    return this._deck;
  }

  addCard(card) {
    if (card instanceof Card) {
      this._deck.push(card);
    } else {
      throw new Error("Wrong type. Only Card objects can be added to deck.");
    }
  }

  show() {
    return this._deck.map((card) => card.value).join(",");
  }
}

var deck = Deck.generateDeck(SKYJO);
console.log("Deck length: " + deck.cardsDeck.length);
console.log("Deck cards: [" + deck.show() + "]");
