import { Card } from "../model/card.js";

test("Crear carta con valor correcto", () => {
  const carta = new Card(5);
  expect(carta.value).toBe(5);
});
