/**
 * Helper functions for transforming game state snapshots into view models
 * used by the App component. These functions normalize and sanitize data
 * from the game engine to ensure safe rendering in the UI.
 */

/**
 * Transforms a deck snapshot into a view model for rendering.
 * Creates a normalized representation of the deck with size, base image,
 * and the top card information (if available).
 *
 * @param {Object|null|undefined} deckSnapshot - The deck snapshot from the game state
 * @returns {Object|null} View model with:
 *   - size: number of cards remaining in deck (defaults to 0)
 *   - baseImage: path to the deck back image (from snapshot.backImage)
 *   - firstCard: object with image, visible flag, and alt text, or null if no top card
 */
export function buildDeckView(deckSnapshot) {
  if (!deckSnapshot) {
    return null;
  }

  const topCard = deckSnapshot.topCard ?? null;
  return {
    size: deckSnapshot.size ?? 0,
    baseImage: deckSnapshot.backImage ?? null,
    firstCard: topCard
      ? {
          image: topCard.image,
          visible: Boolean(topCard.visible),
          alt: topCard.visible
            ? `Top card ${topCard.value}`
            : "Hidden top card",
        }
      : null,
  };
}

/**
 * Normalizes an array of player snapshots into safe view models.
 * Validates and sanitizes player data to prevent rendering errors.
 * Handles missing or malformed player data gracefully.
 *
 * @param {Array|any} players - Array of player objects from game state
 * @returns {Array} Array of normalized player objects with:
 *   - name: player name (may be undefined)
 *   - color: player color or null
 *   - handMatrix: 2D array representing the player's hand layout, or empty array
 *   - handLines: number of lines in the hand matrix, or null if invalid
 */
export function normalizePlayerSnapshots(players) {
  if (!Array.isArray(players)) {
    return [];
  }

  return players.map((player) => ({
    name: player?.name,
    color: player?.color ?? null,
    handMatrix: Array.isArray(player?.hand?.matrix) ? player.hand.matrix : [],
    handLines:
      Number.isInteger(player?.hand?.lines) && player.hand.lines > 0
        ? player.hand.lines
        : null,
  }));
}
