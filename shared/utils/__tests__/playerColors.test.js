import { buildPlayerColors } from "../playerColors.js";

/**
 * Test suite for the buildPlayerColors function.
 * Verifies color palette generation, HSL format, and hue distribution.
 */
describe("buildPlayerColors", () => {
  /**
   * Verifies that buildPlayerColors generates the correct number of colors.
   */
  it("generates correct number of colors", () => {
    const colors = buildPlayerColors(4);
    expect(colors).toHaveLength(4);

    const colors8 = buildPlayerColors(8);
    expect(colors8).toHaveLength(8);
  });

  /**
   * Verifies that buildPlayerColors generates valid HSL color strings.
   */
  it("generates valid HSL color strings", () => {
    const colors = buildPlayerColors(3);

    for (const color of colors) {
      expect(color).toMatch(/^hsl\(\d+,\s*\d+%,\s*\d+%\)$/);
    }
  });

  /**
   * Verifies that buildPlayerColors distributes hues evenly across the color wheel.
   */
  it("distributes hues evenly across color wheel", () => {
    const colors = buildPlayerColors(4);
    const hues = colors.map((color) => {
      const match = color.match(/^hsl\((\d+),/);
      return parseInt(match[1], 10);
    });

    expect(hues[0]).toBe(0);
    expect(hues[1]).toBe(90);
    expect(hues[2]).toBe(180);
    expect(hues[3]).toBe(270);
  });

  /**
   * Verifies that buildPlayerColors distributes hues correctly for 8 players.
   */
  it("distributes hues correctly for 8 players", () => {
    const colors = buildPlayerColors(8);
    const hues = colors.map((color) => {
      const match = color.match(/^hsl\((\d+),/);
      return parseInt(match[1], 10);
    });

    expect(hues[0]).toBe(0);
    expect(hues[1]).toBe(45);
    expect(hues[2]).toBe(90);
    expect(hues[3]).toBe(135);
    expect(hues[4]).toBe(180);
    expect(hues[5]).toBe(225);
    expect(hues[6]).toBe(270);
    expect(hues[7]).toBe(315);
  });

  /**
   * Verifies that buildPlayerColors uses consistent saturation and lightness.
   */
  it("uses consistent saturation and lightness", () => {
    const colors = buildPlayerColors(5);

    for (const color of colors) {
      expect(color).toContain("70%");
      expect(color).toContain("85%");
    }
  });

  /**
   * Verifies that buildPlayerColors handles single player correctly.
   */
  it("handles single player", () => {
    const colors = buildPlayerColors(1);
    expect(colors).toHaveLength(1);
    expect(colors[0]).toBe("hsl(0, 70%, 85%)");
  });

  /**
   * Verifies that buildPlayerColors handles zero players (empty array).
   */
  it("handles zero players", () => {
    const colors = buildPlayerColors(0);
    expect(colors).toHaveLength(0);
    expect(Array.isArray(colors)).toBe(true);
  });

  /**
   * Verifies that buildPlayerColors generates unique hues for each player.
   */
  it("generates unique hues for each player", () => {
    const colors = buildPlayerColors(6);
    const hues = colors.map((color) => {
      const match = color.match(/^hsl\((\d+),/);
      return parseInt(match[1], 10);
    });

    const uniqueHues = new Set(hues);
    expect(uniqueHues.size).toBe(colors.length);
  });

  /**
   * Verifies that buildPlayerColors handles large number of players.
   */
  it("handles large number of players", () => {
    const colors = buildPlayerColors(20);
    expect(colors).toHaveLength(20);

    const hues = colors.map((color) => {
      const match = color.match(/^hsl\((\d+),/);
      return parseInt(match[1], 10);
    });

    // Verify hues are distributed (first should be 0, last should be close to 360)
    expect(hues[0]).toBe(0);
    expect(hues[hues.length - 1]).toBeGreaterThan(300);
  });

  /**
   * Verifies that buildPlayerColors rounds hue values correctly.
   */
  it("rounds hue values correctly", () => {
    const colors = buildPlayerColors(3);
    const hues = colors.map((color) => {
      const match = color.match(/^hsl\((\d+),/);
      return parseInt(match[1], 10);
    });

    // For 3 players: 0°, 120°, 240°
    expect(hues[0]).toBe(0);
    expect(hues[1]).toBe(120);
    expect(hues[2]).toBe(240);
  });
});
