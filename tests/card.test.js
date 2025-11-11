import { Card } from "../frontend/models/card.js";

const buildGame = (values = [5, 10, -2]) => {
  const images = ["images/5.jpg", "images/10.jpg", "images/minus2.jpg"];
  const back = "images/back.jpg";

  return {
    name: "Sample",
    values,
    imageFor(value) {
      const valueIndex = values.indexOf(value);
      if (valueIndex === -1) {
        throw new Error(`No image for value ${value}`);
      }

      return images[valueIndex];
    },
    backImage: back,
  };
};

const buildLegacyGame = (values = [5, 10, -2]) => {
  const baseGame = buildGame(values);
  return {
    ...baseGame,
    backImage() {
      return baseGame.backImage;
    },
  };
};

describe("Card", () => {
  test("initializes hidden by default and reveals on visibility", () => {
    const card = new Card(5, buildGame());

    expect(card.value).toBe("X");

    card.visible = true;

    expect(card.value).toBe(5);
  });

  test("exposes themed card images when visible", () => {
    const game = buildGame();
    const card = new Card(5, game);

    expect(card.image).toBe("images/back.jpg");

    card.visible = true;

    expect(card.image).toBe("images/5.jpg");
  });

  test("supports legacy games exposing back image as a function", () => {
    const legacyGame = buildLegacyGame();
    const card = new Card(10, legacyGame);

    expect(card.image).toBe("images/back.jpg");
    card.visible = true;
    expect(card.image).toBe("images/10.jpg");
  });

  test("rejects non-boolean visibility assignments", () => {
    const card = new Card(5, buildGame());

    expect(() => {
      card.visible = "true";
    }).toThrow("Card visibility must be a boolean");
  });

  test.each([null, undefined])("rejects missing card values %p", (badValue) => {
    expect(() => new Card(badValue, buildGame())).toThrow(
      "Card value must not be null or undefined"
    );
  });

  test("rejects missing game definition", () => {
    expect(() => new Card(5, null)).toThrow("Card requires a game definition");
  });

  test("rejects game definitions without values array", () => {
    expect(() => new Card(5, { name: "Broken" })).toThrow(
      "Game definition must provide a values array"
    );
  });

  test("rejects values not present in the game definition", () => {
    const game = buildGame([1, 2]);

    expect(() => new Card(5, game)).toThrow(
      "Card value not available in the game: Sample"
    );
  });
});
