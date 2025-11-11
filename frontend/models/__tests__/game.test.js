import { Game } from "../game.js";

const buildImagesFor = (values) =>
  values.map((_, index) => `images/theme-${index}.jpg`);
const sampleBackImage = "images/back.jpg";

describe("Game", () => {
  test("stores validated data and protects internal arrays", () => {
    const possibleValues = [-2, -1, 0, 1, 2, 3, 4, 5, 10];
    const quantities = [5, 5, 10, 10, 10, 10, 10, 10, 2];
    const images = buildImagesFor(possibleValues);

    const game = new Game(
      "  Skyjo  ",
      possibleValues,
      quantities,
      images,
      sampleBackImage,
      3,
      1,
      2,
      8
    );

    expect(game.name).toBe("Skyjo");
    expect(game.values).toEqual(possibleValues);
    expect(game.quantities).toEqual(quantities);
    expect(game.images).toEqual(images);
    expect(game.backImage).toBe(sampleBackImage);
    expect(game.handsize).toBe(3);
    expect(game.lines).toBe(1);
    expect(game.minPlayers).toBe(2);
    expect(game.maxPlayers).toBe(8);

    const valuesSnapshot = game.values;
    valuesSnapshot.push(99);

    const imagesSnapshot = game.images;
    imagesSnapshot[0] = "images/override.jpg";

    expect(game.values).toEqual(possibleValues);
    expect(valuesSnapshot).not.toEqual(game.values);
    expect(game.images).toEqual(images);
    expect(imagesSnapshot).not.toEqual(game.images);
  });

  test("imageFor returns the themed image for a card value", () => {
    const values = [0, 1, 2];
    const images = buildImagesFor(values);
    const game = new Game(
      "Skyjo",
      values,
      [1, 1, 1],
      images,
      sampleBackImage,
      3,
      1,
      2,
      8
    );

    expect(game.imageFor(2)).toBe(images[2]);
  });

  test("exposes legacy min/max getters for backwards compatibility", () => {
    const values = [1];
    const images = buildImagesFor(values);
    const game = new Game(
      "Skyjo",
      values,
      [1],
      images,
      sampleBackImage,
      3,
      1,
      2,
      8
    );

    expect(game.min).toBe(game.minPlayers);
    expect(game.max).toBe(game.maxPlayers);
  });

  test.each([null, undefined, 123, {}, [], () => {}])(
    "rejects non-string name %p",
    (badName) => {
      expect(
        () =>
          new Game(
            badName,
            [1],
            [1],
            ["images/theme-0.jpg"],
            sampleBackImage,
            1,
            1,
            2,
            4
          )
      ).toThrow("Game name must be a string");
    }
  );

  test.each(["", "   "])("rejects empty name %p", (badName) => {
    expect(
      () =>
        new Game(
          badName,
          [1],
          [1],
          ["images/theme-0.jpg"],
          sampleBackImage,
          1,
          1,
          2,
          4
        )
    ).toThrow("Game name must not be empty");
  });

  test.each([
    null,
    undefined,
    "not array",
    [],
    [1, "two", 3],
    [Infinity],
    [NaN],
  ])("rejects invalid values %p", (badValues) => {
    expect(
      () =>
        new Game(
          "Skyjo",
          badValues,
          [1],
          ["images/theme-0.jpg"],
          sampleBackImage,
          1,
          1,
          2,
          4
        )
    ).toThrow(
      Array.isArray(badValues) && badValues.length > 0
        ? "Game values must be finite numbers"
        : "Game values must be a non-empty array of numbers"
    );
  });

  test("rejects quantities with the wrong length", () => {
    expect(
      () =>
        new Game(
          "Skyjo",
          [1, 2],
          [2],
          ["images/theme-0.jpg", "images/theme-1.jpg"],
          sampleBackImage,
          1,
          1,
          2,
          4
        )
    ).toThrow("Game quantities must match the length of values");
  });

  test.each([null, undefined, "not array", [1.5, 2], [-1, 2], [1, {}]])(
    "rejects invalid quantities %p",
    (badQuantities) => {
      expect(
        () =>
          new Game(
            "Skyjo",
            [1, 2],
            badQuantities,
            ["images/theme-0.jpg", "images/theme-1.jpg"],
            sampleBackImage,
            1,
            1,
            2,
            4
          )
      ).toThrow(
        Array.isArray(badQuantities) && badQuantities.length === 2
          ? "Game quantities must be non-negative integers"
          : "Game quantities must match the length of values"
      );
    }
  );

  test("rejects images with the wrong length", () => {
    expect(
      () =>
        new Game(
          "Skyjo",
          [1, 2, 3],
          [1, 1, 1],
          ["images/theme-0.jpg"],
          sampleBackImage,
          1,
          1,
          2,
          4
        )
    ).toThrow("Card images paths must match the length of values");
  });

  test.each([null, undefined, "", "   ", "not-an-image.txt", 123, {}, []])(
    "rejects invalid image entries %p",
    (invalidImage) => {
      const expectedMessage =
        typeof invalidImage !== "string"
          ? "Card image path at index 0 must be a string"
          : invalidImage.trim()
            ? "Card image path at index 0 must point to a supported image file"
            : "Card image path at index 0 must not be empty";

      expect(
        () =>
          new Game(
            "Skyjo",
            [1],
            [1],
            [invalidImage],
            sampleBackImage,
            1,
            1,
            2,
            4
          )
      ).toThrow(expectedMessage);
    }
  );

  test.each([null, undefined, "", "   ", "not-an-image.txt", 123, {}, []])(
    "rejects invalid back image %p",
    (invalidBackImage) => {
      const expectedMessage =
        typeof invalidBackImage !== "string"
          ? "Card back image path must be a string"
          : invalidBackImage.trim()
            ? "Card back image path must point to a supported image file"
            : "Card back image path must not be empty";

      expect(
        () =>
          new Game(
            "Skyjo",
            [1],
            [1],
            ["images/theme-0.jpg"],
            invalidBackImage,
            1,
            1,
            2,
            4
          )
      ).toThrow(expectedMessage);
    }
  );

  test.each([0, -1, 1.5, "3", null, undefined])(
    "rejects invalid handsize %p",
    (badHandsize) => {
      expect(
        () =>
          new Game(
            "Skyjo",
            [1],
            [1],
            ["images/theme-0.jpg"],
            sampleBackImage,
            badHandsize,
            1,
            2,
            4
          )
      ).toThrow("Game handsize must be a positive integer");
    }
  );

  test.each([0, -1, 1.5, "3", null, undefined])(
    "rejects invalid lines %p",
    (badLines) => {
      expect(
        () =>
          new Game(
            "Skyjo",
            [1],
            [1],
            ["images/theme-0.jpg"],
            sampleBackImage,
            3,
            badLines,
            2,
            4
          )
      ).toThrow("Game lines must be a positive integer");
    }
  );

  test.each([0, -1, 1.5, "2", null, undefined])(
    "rejects invalid min players %p",
    (badMin) => {
      expect(
        () =>
          new Game(
            "Skyjo",
            [1],
            [1],
            ["images/theme-0.jpg"],
            sampleBackImage,
            3,
            1,
            badMin,
            4
          )
      ).toThrow("Game min players must be a positive integer");
    }
  );

  test.each([0, -1, 1.5, "4", null, undefined])(
    "rejects invalid max players %p",
    (badMax) => {
      expect(
        () =>
          new Game(
            "Skyjo",
            [1],
            [1],
            ["images/theme-0.jpg"],
            sampleBackImage,
            3,
            1,
            2,
            badMax
          )
      ).toThrow("Game max players must be a positive integer");
    }
  );

  test("rejects max players smaller than min players", () => {
    expect(
      () =>
        new Game(
          "Skyjo",
          [1],
          [1],
          ["images/theme-0.jpg"],
          sampleBackImage,
          3,
          1,
          4,
          3
        )
    ).toThrow("Game max players must be greater than or equal to min players");
  });
});
