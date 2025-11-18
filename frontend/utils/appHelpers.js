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
 * @param {Function} setGameState - State setter for game state
 * @param {Function} setLogEntries - State setter for log entries
 * @param {Function} setActivePlayers - State setter for active players
 * @param {Function} setDeckView - State setter for deck view
 */
export function resetGameState(
  setCurrentSnapshot,
  setGameState,
  setLogEntries,
  setActivePlayers,
  setDeckView
) {
  setCurrentSnapshot(null);
  setGameState(null);
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

/**
 * Extracts a message string from a log entry.
 * Handles both object entries with a message property and plain string entries.
 *
 * @param {Object|string|unknown} entry - The log entry to extract message from
 * @returns {string} The extracted message string
 */
export function extractLogEntryMessage(entry) {
  if (entry && typeof entry === "object" && entry !== null) {
    return entry.message ?? "";
  }
  return String(entry ?? "");
}

/**
 * Validates a player name according to game rules.
 * @param {string} playerName - The player name to validate
 * @param {number} maxLength - Maximum allowed length for player name
 * @returns {Object} Validation result with isValid flag and error message
 *   - isValid: {boolean} True if player name is valid
 *   - errorMessage: {string} Error message if invalid, empty string if valid
 */
export function validatePlayerName(playerName, maxLength) {
  const trimmed = typeof playerName === "string" ? playerName.trim() : "";
  const length = trimmed.length;

  if (length === 0) {
    return {
      isValid: false,
      errorMessage: "Player name must not be empty.",
    };
  }

  if (length > maxLength) {
    return {
      isValid: false,
      errorMessage: `Player name must be ${maxLength} characters or fewer.`,
    };
  }

  return {
    isValid: true,
    errorMessage: "",
  };
}

/**
 * Normalizes an array of player names by trimming and filtering out empty strings.
 * @param {Array} playerNames - Array of player names to normalize
 * @returns {string[]} Array of normalized (trimmed) non-empty player names
 */
export function normalizePlayerNames(playerNames) {
  if (!Array.isArray(playerNames)) {
    return [];
  }
  return playerNames
    .map((name) => normalizePlayerName(name))
    .filter((name) => name.length > 0);
}

/**
 * Normalizes a single player name string by trimming whitespace.
 * @param {string|unknown} playerName - The player name to normalize
 * @returns {string} Normalized player name or empty string if invalid
 */
export function normalizePlayerName(playerName) {
  return typeof playerName === "string" && playerName.trim().length > 0
    ? playerName.trim()
    : "";
}

/**
 * Builds a possessive turn label from a player name.
 * Handles names ending in 's' correctly (e.g., "Alice" -> "Alice's turn", "James" -> "James' turn").
 * @param {string} rawName - The raw player name
 * @returns {string} Formatted possessive turn label
 */
export function buildPossessiveTurnLabel(rawName) {
  const trimmed = normalizePlayerName(rawName);
  if (!trimmed) {
    return "Player turn";
  }
  const suffix = /s$/i.test(trimmed) ? "'" : "'s";
  return `${trimmed}${suffix} turn`;
}
