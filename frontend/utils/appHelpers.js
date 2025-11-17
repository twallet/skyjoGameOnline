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
