import { Card } from "../model/card.js";

const skyjo = { name: "Skyjo", values: [-2, -1, 0, 1, 2, 3, 4, 5, 10] };

describe("Card", () => {
  test("reveals the numeric value when visibility is true", () => {
    const card = new Card(-2, skyjo);

    expect(card.value).toBe("X");

    card.visible = true;

    expect(card.value).toBe(-2);
  });

  test("rejects visibility values that are not boolean", () => {
    const card = new Card(-1, skyjo);

    expect(() => {
      card.visible = "yes";
    }).toThrow("Card visibility must be a boolean");
  });
});
