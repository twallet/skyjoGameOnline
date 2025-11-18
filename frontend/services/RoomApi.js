import { normalizeRoomId } from "../utils/appHelpers.js";

/**
 * Default base URL for the API when running in non-browser environment.
 * Empty string in browser (uses relative URLs), localhost:4000 in Node.js.
 * @type {string}
 */
const DEFAULT_BASE_URL =
  typeof window !== "undefined" && window.location
    ? ""
    : "http://localhost:4000";

/**
 * Current base URL for API requests. Can be configured via RoomApi.configure().
 * @type {string}
 */
let baseUrl = DEFAULT_BASE_URL;

/**
 * Builds a complete URL from a path by combining with the base URL.
 * @param {string} path - The API path (must start with "/")
 * @returns {string} Complete URL combining baseUrl and path
 * @throws {Error} If path doesn't start with "/"
 */
function buildUrl(path) {
  if (!path.startsWith("/")) {
    throw new Error(`API paths must start with "/": received "${path}"`);
  }

  if (!baseUrl) {
    return path;
  }

  const trimmedBase = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;

  return `${trimmedBase}${path}`;
}

/**
 * Makes an HTTP request to the Skyjo rooms API.
 * Handles request/response serialization, error handling, and JSON parsing.
 *
 * @param {string} path - The API endpoint path (must start with "/")
 * @param {Object} [options={}] - Request options
 * @param {string} [options.method="GET"] - HTTP method (GET, POST, etc.)
 * @param {Object|string} [options.body] - Request body (will be JSON stringified if object)
 * @param {Object} [options.headers={}] - Additional HTTP headers
 * @returns {Promise<Object|undefined>} Parsed JSON response payload, or undefined if empty
 * @throws {Error} If request fails, network error, or invalid JSON response
 */
async function request(path, options = {}) {
  const { method = "GET", body, headers = {} } = options;
  const init = { method, headers: { ...headers } };

  if (body !== undefined) {
    init.body = typeof body === "string" ? body : JSON.stringify(body);
    if (!init.headers["Content-Type"]) {
      init.headers["Content-Type"] = "application/json";
    }
  }

  const target = buildUrl(path);
  let response;
  try {
    response = await fetch(target, init);
  } catch (error) {
    throw new Error(
      `Unable to reach Skyjo rooms API at ${target}: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }

  const text = await response.text();
  const hasContent = text.length > 0;
  const payload = hasContent ? safeParseJson(text) : null;

  if (!response.ok) {
    const message =
      (payload && payload.error) ||
      (payload && payload.message) ||
      `Request to ${target} failed with status ${response.status}`;
    throw new Error(message);
  }

  return payload ?? undefined;
}

/**
 * Safely parses JSON string, throwing a descriptive error on failure.
 * @param {string} raw - Raw JSON string to parse
 * @returns {Object} Parsed JSON object
 * @throws {Error} If JSON parsing fails
 */
function safeParseJson(raw) {
  try {
    return JSON.parse(raw);
  } catch (error) {
    throw new Error(
      `Skyjo rooms API returned invalid JSON: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

/**
 * API client for Skyjo room management and game operations.
 * Provides methods to create/join rooms, manage game state, and perform game actions.
 */
export const RoomApi = {
  /**
   * Configures the base URL for all API requests.
   * @param {Object} [options={}] - Configuration options
   * @param {string} options.baseUrl - Base URL for API requests (e.g., "http://localhost:4000")
   * @throws {TypeError} If baseUrl is not a string
   */
  configure({ baseUrl: nextBaseUrl } = {}) {
    if (typeof nextBaseUrl !== "string") {
      throw new TypeError("RoomApi.configure expects a baseUrl string.");
    }
    baseUrl = nextBaseUrl;
  },

  /**
   * Gets the current base URL used for API requests.
   * @returns {string} Current base URL
   */
  getBaseUrl() {
    return baseUrl;
  },

  /**
   * Creates a new game room.
   * @param {string} [roomId] - Optional room ID (will be generated if not provided)
   * @returns {Promise<Object>} Room creation response with roomId
   */
  async createRoom(roomId) {
    const normalized = normalizeRoomId(roomId);
    const response = await request("/rooms", {
      method: "POST",
      body: normalized ? { roomId: normalized } : undefined,
    });
    return response;
  },

  /**
   * Lists all available game rooms.
   * @returns {Promise<Object>} Response containing rooms array
   */
  async listRooms() {
    const response = await request("/rooms");
    return response ?? { rooms: [] };
  },

  /**
   * Gets scores for all rooms.
   * @returns {Promise<Object>} Response containing room scores
   */
  async getRoomScores() {
    return request("/rooms/scores");
  },

  /**
   * Gets the current state of a room including players and game snapshot.
   * @param {string} roomId - The room ID to fetch
   * @returns {Promise<Object>} Room state with players, gameStarted flag, and snapshot
   * @throws {Error} If room ID is invalid or room not found
   */
  async getRoom(roomId) {
    const normalized = normalizeRequiredRoomId(roomId);
    return request(`/rooms/${normalized}`);
  },

  /**
   * Joins a player to an existing room.
   * @param {string} roomId - The room ID to join
   * @param {string} name - Player name to join with
   * @returns {Promise<Object>} Response with updated players list and roomId
   * @throws {Error} If room ID is invalid
   */
  async joinRoom(roomId, name) {
    const normalized = normalizeRequiredRoomId(roomId);
    const safeName = typeof name === "string" ? name.trim() : "";
    return request(`/rooms/${normalized}/join`, {
      method: "POST",
      body: { name: safeName },
    });
  },

  /**
   * Starts the game in a room.
   * @param {string} roomId - The room ID where the game should start
   * @returns {Promise<Object>} Game session payload with players, deck, state, and logEntries
   * @throws {Error} If room ID is invalid or game cannot be started
   */
  async startGame(roomId) {
    const normalized = normalizeRequiredRoomId(roomId);
    return request(`/rooms/${normalized}/start`, {
      method: "POST",
    });
  },

  /**
   * Reveals an initial card during the setup phase.
   * @param {string} roomId - The room ID
   * @param {string} playerName - Name of the player revealing the card
   * @param {number} position - Position/index of the card to reveal
   * @returns {Promise<Object>} Game session payload with updated state
   * @throws {Error} If room ID is invalid, player name is empty, or position is not an integer
   */
  async revealInitialCard(roomId, playerName, position) {
    const normalized = normalizeRequiredRoomId(roomId);
    const safeName = normalizeRequiredPlayerName(playerName);
    validatePosition(position);

    return request(`/rooms/${normalized}/initial-flip`, {
      method: "POST",
      body: { playerName: safeName, position },
    });
  },

  /**
   * Draws a card from the deck or discard pile.
   * @param {string} roomId - The room ID
   * @param {string} playerName - Name of the player drawing the card
   * @param {string} source - Source of the card ("deck" or "discard")
   * @returns {Promise<Object>} Game session payload with updated state
   * @throws {Error} If room ID is invalid or player name is empty
   */
  async drawCard(roomId, playerName, source) {
    const normalized = normalizeRequiredRoomId(roomId);
    const safeName = normalizeRequiredPlayerName(playerName);
    const normalizedSource = source === "discard" ? "discard" : "deck";

    return request(`/rooms/${normalized}/main/draw`, {
      method: "POST",
      body: { playerName: safeName, source: normalizedSource },
    });
  },

  /**
   * Replaces a card with the drawn card.
   * @param {string} roomId - The room ID
   * @param {string} playerName - Name of the player replacing the card
   * @param {number} position - Position/index of the card to replace
   * @returns {Promise<Object>} Game session payload with updated state
   * @throws {Error} If room ID is invalid, player name is empty, or position is not an integer
   */
  async replaceWithDrawnCard(roomId, playerName, position) {
    const normalized = normalizeRequiredRoomId(roomId);
    const safeName = normalizeRequiredPlayerName(playerName);
    validatePosition(position);

    return request(`/rooms/${normalized}/main/replace`, {
      method: "POST",
      body: { playerName: safeName, position },
    });
  },

  /**
   * Reveals a card after discarding the drawn card.
   * @param {string} roomId - The room ID
   * @param {string} playerName - Name of the player revealing the card
   * @param {number} position - Position/index of the card to reveal
   * @returns {Promise<Object>} Game session payload with updated state
   * @throws {Error} If room ID is invalid, player name is empty, or position is not an integer
   */
  async revealAfterDiscard(roomId, playerName, position) {
    const normalized = normalizeRequiredRoomId(roomId);
    const safeName = normalizeRequiredPlayerName(playerName);
    validatePosition(position);

    return request(`/rooms/${normalized}/main/reveal`, {
      method: "POST",
      body: { playerName: safeName, position },
    });
  },

  /**
   * Resets a room to its initial state (clears game state, keeps players).
   * @param {string} roomId - The room ID to reset
   * @returns {Promise<void>} Resolves when reset is complete
   * @throws {Error} If room ID is invalid
   */
  async resetRoom(roomId) {
    const normalized = normalizeRequiredRoomId(roomId);
    await request(`/rooms/${normalized}/reset`, {
      method: "POST",
    });
  },
};

/**
 * Normalizes and validates a player name.
 * @param {string|unknown} playerName - The player name to normalize
 * @returns {string} Normalized (trimmed) player name
 * @throws {Error} If player name is empty or invalid
 */
function normalizeRequiredPlayerName(playerName) {
  const safeName = typeof playerName === "string" ? playerName.trim() : "";
  if (!safeName) {
    throw new Error("Player name must not be empty.");
  }
  return safeName;
}

/**
 * Validates that a position is an integer.
 * @param {unknown} position - The position value to validate
 * @throws {Error} If position is not an integer
 */
function validatePosition(position) {
  if (!Number.isInteger(position)) {
    throw new Error("Card position must be an integer.");
  }
}

/**
 * Normalizes a room ID and throws an error if it's empty or invalid.
 * Used internally by RoomApi methods that require a valid room ID.
 * @param {string|unknown} value - The room ID value to normalize
 * @returns {string} Normalized room ID (uppercase, trimmed)
 * @throws {Error} If room ID is empty or invalid
 */
function normalizeRequiredRoomId(value) {
  const normalized = normalizeRoomId(value);
  if (!normalized) {
    throw new Error("Room id must not be empty.");
  }
  return normalized;
}
