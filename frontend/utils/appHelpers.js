/**
 * Helper function to extract error message from error objects.
 * @param {Error|unknown} error - The error object or value
 * @returns {string} The error message string
 */
export function getErrorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}

/**
 * Helper function to normalize room ID (trim and uppercase).
 * @param {string|unknown} roomId - The room ID to normalize
 * @returns {string} Normalized room ID or empty string
 */
export function normalizeRoomId(roomId) {
  return typeof roomId === "string" && roomId.trim().length > 0
    ? roomId.trim().toUpperCase()
    : "";
}

/**
 * Helper function to reset game state to initial values.
 * @param {Function} setCurrentSnapshot - State setter for current snapshot
 * @param {Function} setSessionState - State setter for session state
 * @param {Function} setGameStarted - State setter for game started flag
 * @param {Function} setLogEntries - State setter for log entries
 * @param {Function} setActivePlayers - State setter for active players
 * @param {Function} setDeckView - State setter for deck view
 */
export function resetGameState(
  setCurrentSnapshot,
  setSessionState,
  setGameStarted,
  setLogEntries,
  setActivePlayers,
  setDeckView
) {
  setCurrentSnapshot(null);
  setSessionState(null);
  setGameStarted(false);
  setLogEntries([]);
  setActivePlayers([]);
  setDeckView(null);
}

/**
 * Helper function to create room state object with player validation.
 * @param {string[]} players - Array of player names
 * @param {Game} game - The game instance with min/max player constraints
 * @param {boolean} gameStarted - Whether the game has started
 * @returns {Object} Room state object
 */
export function createRoomState(players, game, gameStarted = false) {
  return {
    players,
    canAddPlayer: players.length < game.maxPlayers,
    canStartGame: players.length >= game.minPlayers,
    gameStarted,
  };
}

/**
 * Default back image path for deck cards.
 * @type {string}
 */
const DEFAULT_BACK_IMAGE = "./assets/images/back.jpg";

/**
 * Transforms a deck snapshot into a view model for rendering.
 * Creates a normalized representation of the deck with size, base image,
 * and the top card information (if available).
 *
 * @param {Object|null|undefined} deckSnapshot - The deck snapshot from the game state
 * @returns {Object|null} View model with:
 *   - size: number of cards remaining in deck (defaults to 0)
 *   - baseImage: path to the deck back image (from snapshot.backImage, defaults to DEFAULT_BACK_IMAGE)
 *   - firstCard: object with image, visible flag, and alt text, or null if no top card
 */
export function buildDeckView(deckSnapshot) {
  if (!deckSnapshot) {
    return null;
  }

  const topCard = deckSnapshot.topCard ?? null;
  return {
    size: deckSnapshot.size ?? 0,
    baseImage: deckSnapshot.backImage ?? DEFAULT_BACK_IMAGE,
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
