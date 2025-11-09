// Clase que representa la configuración base de un juego.
export class Game {
  /**
   * Crea una nueva instancia de juego.
   * @param {string} name Nombre del juego.
   * @param {number[]} possibleValues Valores posibles para las cartas.
   * @param {number[]} quantities Cantidades disponibles para cada valor.
   * @param {number} handsize Tamaño de la mano inicial para cada jugador.
   */
  constructor(name, possibleValues, quantities, handsize) {
    this._name = name;
    this._values = possibleValues;
    this._quantities = quantities;
    this._handsize = handsize;
  }

  // Devuelve el nombre del juego.
  get name() {
    return this._name;
  }

  // Regresa el arreglo con los valores posibles de las cartas.
  get values() {
    return this._values;
  }

  // Regresa las cantidades disponibles por cada valor.
  get quantities() {
    return this._quantities;
  }

  // Devuelve el tamaño de la mano inicial.
  get handsize() {
    return this._handsize;
  }
}
