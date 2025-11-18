import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "https://esm.sh/react@18?dev";

import { Game } from "../../shared/models/game.js";
import { GameSession } from "../../shared/models/gameSession.js";
import { consoleLogger } from "../../shared/logger.js";
import { generateRoomId } from "../../shared/generateRoomId.js";
import { buildPlayerColors } from "../../shared/utils/playerColors.js";
import { RoomApi } from "../services/RoomApi.js";
import { GamePlayView } from "./GamePlayView.js";
import { GameSetupView } from "./GameSetupView.js";
import {
  buildDeckView,
  getErrorMessage,
  normalizeRoomId,
  resetGameState,
  createRoomState,
  extractLogEntryMessage,
  validatePlayerName,
  normalizePlayerNames,
  normalizePlayerName,
} from "../utils/appHelpers.js";

/**
 * Room polling interval in milliseconds.
 * How often to refresh room state from the server to keep UI in sync.
 * @type {number}
 */
const ROOM_POLL_INTERVAL_MS = 3000;

/**
 * Column removal timer buffer in milliseconds.
 * Additional time added to column removal expiration timers to ensure
 * state refresh happens slightly after the expiration time.
 * @type {number}
 */
const COLUMN_REMOVAL_TIMER_BUFFER_MS = 50;

/**
 * Skyjo game configuration instance.
 * Defines card values, quantities, images, and game rules.
 */
const skyjo = new Game(
  "Skyjo",
  [-2, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
  [5, 10, 15, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10],
  [
    "./assets/images/minus2.jpg",
    "./assets/images/minus1.jpg",
    "./assets/images/0.jpg",
    "./assets/images/1.jpg",
    "./assets/images/2.jpg",
    "./assets/images/3.jpg",
    "./assets/images/4.jpg",
    "./assets/images/5.jpg",
    "./assets/images/6.jpg",
    "./assets/images/7.jpg",
    "./assets/images/8.jpg",
    "./assets/images/9.jpg",
    "./assets/images/10.jpg",
    "./assets/images/11.jpg",
    "./assets/images/12.jpg",
  ],
  "./assets/images/back.jpg",
  12,
  4,
  2,
  8
);

/**
 * Main App component for Skyjo game.
 * Manages room creation/joining, game state, and player interactions.
 *
 * @returns {React.ReactElement} The rendered App component
 */
export function App() {
  // Player colors array memoized for performance
  const playerColors = useMemo(() => buildPlayerColors(skyjo.maxPlayers), []);

  // Room management state
  /**
   * Current room ID. Empty string initially, set once when creating or joining a room,
   * and remains unchanged for the session. Used to identify the game room on the server.
   * Used in: GameSetupView
   */
  const [roomId, setRoomId] = useState("");
  /**
   * Room state metadata including player list, game status flags, and room capabilities.
   * Used to control UI visibility and button states in the setup view.
   * Used in: GameSetupView
   */
  const [roomState, setRoomState] = useState({
    players: [],
    canAddPlayer: true,
    canStartGame: false,
    gameStarted: false,
  });

  // UI state
  /**
   * Processing indicator flag. Set to true during async operations (creating/joining rooms,
   * loading room state, game actions) to disable UI controls and prevent duplicate actions.
   * Used in: GameSetupView, GamePlayView
   */
  const [isProcessing, setIsProcessing] = useState(false);
  /**
   * Error message displayed to the user. Set when API calls fail or validation errors occur.
   * Empty string when there are no errors.
   * Used in: GameSetupView
   */
  const [errorMessage, setErrorMessage] = useState("");

  // Player management state
  /**
   * List of all player names currently in the room. Updated when players join or leave.
   * Used to display the player list in the setup view.
   * Used in: GameSetupView
   */
  const [playerNames, setPlayerNames] = useState([]);
  /**
   * Current value of the player name input field. Used for controlled input component.
   * May be cleared or preserved based on room flow state.
   * Used in: GameSetupView
   */
  const [newPlayerName, setNewPlayerName] = useState("");
  /**
   * Name of the local player (the user of this browser session). Set when joining or creating a room.
   * Used to identify which player's view to highlight in the game view.
   * Used in: GamePlayView
   */
  const [localPlayerName, setLocalPlayerName] = useState("");

  // Game state
  /**
   * Array of active player objects with their game state (hands, scores, etc.).
   * Updated from server snapshots during gameplay.
   * Used in: GamePlayView
   */
  const [activePlayers, setActivePlayers] = useState([]);
  /**
   * Deck view data structure containing card information for display.
   * Includes deck and discard pile states, formatted for UI rendering.
   * Used in: GamePlayView
   */
  const [deckView, setDeckView] = useState(null);
  /**
   * Complete game snapshot from the server, including players, deck, state, and log entries.
   * Used to restore game state after page refresh or reconnection.
   * Used in: GamePlayView
   */
  const [currentSnapshot, setCurrentSnapshot] = useState(null);
  /**
   * Current game state including turn information, pending actions, and game phase.
   * Extracted from snapshot.state, used to control game flow and validate actions.
   * Used in: GamePlayView
   */
  const [gameState, setGameState] = useState(null);
  /**
   * Array of log entries showing game events and player actions.
   * Updated from server snapshots to display game history.
   * Used in: GamePlayView
   */
  const [logEntries, setLogEntries] = useState([]);

  // Room flow state
  /**
   * Flag indicating the user is in the "join existing room" flow (from URL invite link).
   * Controls which UI elements are shown in the setup view.
   * Used in: GameSetupView (as isJoiningRoom prop)
   */
  const [isJoiningExistingRoom, setIsJoiningExistingRoom] = useState(false);
  /**
   * Flag indicating the user has successfully created a room.
   * Used to hide the player name input and show room management UI.
   * Used in: GameSetupView
   */
  const [hasCreatedRoom, setHasCreatedRoom] = useState(false);

  // LAN host configuration for local network sharing
  /**
   * Local network IP address for sharing room links with devices on the same Wi-Fi network.
   * Loaded from localStorage on mount, can be set via user prompt when creating a room.
   * Used to generate shareable links with local IP instead of localhost.
   * Used in: Internal (for generating invite links)
   */
  const [lanHost, setLanHost] = useState(() => {
    if (typeof window !== "undefined" && window.localStorage) {
      return window.localStorage.getItem("skyjo:lanHost") ?? "";
    }
    return "";
  });
  /**
   * Flag indicating the user has skipped the LAN host prompt.
   * Prevents showing the prompt again during the same session.
   * Used in: Internal (controls LAN host prompt display)
   */
  const [lanHostSkipped, setLanHostSkipped] = useState(false);

  // Refs for tracking state across renders
  /**
   * Counter tracking how many log entries have been logged to console.
   * Used to avoid duplicate console logs when logEntries array updates.
   * Persists across renders without causing re-renders.
   * Used in: Internal (for console logging optimization)
   */
  const loggedEventCountRef = useRef(0);
  /**
   * Flag tracking if a room state fetch is currently in progress.
   * Used to prevent concurrent silent room state fetches from overlapping.
   * Persists across renders without causing re-renders.
   * Used in: Internal (for preventing concurrent API calls)
   */
  const isFetchingRoomRef = useRef(false);

  // Parse URL parameters on mount to support invite links
  useEffect(() => {
    if (typeof window === "undefined" || typeof window.location !== "object") {
      return;
    }

    try {
      const params = new URLSearchParams(window.location.search);
      const urlRoomId = params.get("roomId");

      if (urlRoomId) {
        const normalized = normalizeRoomId(urlRoomId);
        setRoomId(normalized);
        setIsJoiningExistingRoom(true);
        setHasCreatedRoom(false);
      }
    } catch (error) {
      consoleLogger.error("Failed to parse join parameters from URL", error);
    }
  }, []);

  /**
   * Syncs room ID to URL query parameters.
   * @param {string} targetRoomId - The room ID to sync to URL
   */
  const syncRoomIdToUrl = (targetRoomId) => {
    if (
      typeof window === "undefined" ||
      typeof window.history?.replaceState !== "function"
    ) {
      return;
    }

    try {
      const url = new URL(window.location.href);
      if (targetRoomId) {
        url.searchParams.set("roomId", targetRoomId);
      } else {
        url.searchParams.delete("roomId");
      }
      window.history.replaceState(
        null,
        "",
        `${url.pathname}${url.search}${url.hash}`
      );
    } catch (error) {
      consoleLogger.error("Failed to sync room id with URL", error);
    }
  };

  // Log new log entries to console
  useEffect(() => {
    if (!Array.isArray(logEntries) || logEntries.length === 0) {
      loggedEventCountRef.current = 0;
      return;
    }

    const startIndex = loggedEventCountRef.current;
    const newEntries = logEntries.slice(startIndex);

    newEntries.forEach((entry) => {
      const message = extractLogEntryMessage(entry);
      consoleLogger.info(`Client event: ${message}`);
    });

    loggedEventCountRef.current = logEntries.length;
  }, [logEntries]);

  /**
   * Loads room state from the server and updates local state.
   * @param {string} targetRoomId - The room ID to load
   * @param {Object} [options={}] - Options object
   * @param {boolean} [options.silent=false] - If true, don't show loading indicator
   * @param {boolean} [options.preservePlayerName=false] - If true, don't clear player name input
   */
  const loadRoomState = async (
    targetRoomId,
    { silent = false, preservePlayerName = false } = {}
  ) => {
    const normalizedRoomId = normalizeRoomId(targetRoomId);

    if (!normalizedRoomId) {
      return;
    }

    if (silent && isFetchingRoomRef.current) {
      return;
    }

    isFetchingRoomRef.current = true;
    if (!silent) {
      setIsProcessing(true);
      consoleLogger.info(`Client action: loading room '${normalizedRoomId}'`);
    }

    try {
      const data = await RoomApi.getRoom(normalizedRoomId);

      const players = Array.isArray(data.players) ? data.players : [];
      setRoomState(createRoomState(players, skyjo, Boolean(data.gameStarted)));
      setPlayerNames(players);
      setErrorMessage("");

      const snapshot = data.snapshot ?? null;
      if (snapshot) {
        setCurrentSnapshot(snapshot);
        setGameState(snapshot.state ?? null);
        setLogEntries(
          Array.isArray(snapshot.logEntries) ? snapshot.logEntries : []
        );
        setActivePlayers(
          Array.isArray(snapshot.players) ? snapshot.players : []
        );
        setDeckView(buildDeckView(snapshot.deck));
      } else {
        resetGameState(
          setCurrentSnapshot,
          setGameState,
          setLogEntries,
          setActivePlayers,
          setDeckView
        );
      }

      if (!silent && !preservePlayerName) {
        setNewPlayerName("");
      }

      if (!silent) {
        const playerCount = Array.isArray(data.players)
          ? data.players.length
          : 0;
        consoleLogger.info(
          `Client event: loaded room '${normalizedRoomId}' with ${playerCount} players`
        );
      }
    } catch (error) {
      consoleLogger.error("Failed to load room state", error);
      if (!silent) {
        setErrorMessage(getErrorMessage(error));
        setRoomState(createRoomState([], skyjo, false));
        setPlayerNames([]);
        resetGameState(
          setCurrentSnapshot,
          setGameState,
          setLogEntries,
          setActivePlayers,
          setDeckView
        );
      }
    } finally {
      if (!silent) {
        setIsProcessing(false);
      }
      isFetchingRoomRef.current = false;
    }
  };

  // Set up timers for pending column removals to refresh room state
  useEffect(() => {
    if (!roomId) {
      return;
    }
    const pendingRemovals = Array.isArray(gameState?.pendingColumnRemovals)
      ? gameState.pendingColumnRemovals
      : [];
    if (pendingRemovals.length === 0) {
      return;
    }
    const now = Date.now();
    const timers = pendingRemovals
      .map((entry) => {
        const expiresAt =
          typeof entry?.expiresAt === "number" ? entry.expiresAt : null;
        if (!expiresAt) {
          return null;
        }
        if (expiresAt <= now) {
          loadRoomState(roomId, { silent: true });
          return null;
        }
        const delay = Math.max(
          expiresAt - now + COLUMN_REMOVAL_TIMER_BUFFER_MS,
          0
        );
        return setTimeout(() => {
          loadRoomState(roomId, { silent: true });
        }, delay);
      })
      .filter(Boolean);

    return () => {
      timers.forEach((timerId) => {
        if (timerId) {
          clearTimeout(timerId);
        }
      });
    };
  }, [roomId, gameState?.pendingColumnRemovals]);

  // Load room state when room ID changes
  // Only reload when roomId changes, not when flow flags change
  useEffect(() => {
    if (!roomId) {
      return;
    }

    const preservePlayerName = hasCreatedRoom || isJoiningExistingRoom;
    loadRoomState(roomId, {
      silent: false,
      preservePlayerName,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  // Poll room state periodically to keep UI in sync
  useEffect(() => {
    if (!roomId) {
      return;
    }

    const intervalId = setInterval(() => {
      loadRoomState(roomId, { silent: true });
    }, ROOM_POLL_INTERVAL_MS);

    return () => {
      clearInterval(intervalId);
    };
  }, [roomId]);

  // Update document title with room and player info
  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    const titleParts = ["Skyjo"];
    const normalizedRoomId = normalizeRoomId(roomId);
    const normalizedPlayerName = normalizePlayerName(localPlayerName);

    if (normalizedPlayerName) {
      titleParts.push(`Player ${normalizedPlayerName}`);
    }
    if (normalizedRoomId) {
      titleParts.push(`Room ${normalizedRoomId}`);
    }

    document.title = titleParts.join(" | ");
  }, [roomId, localPlayerName]);

  /**
   * Applies session payload from API responses to update game state.
   * @param {Object} payload - The session payload from API
   * @param {Array} [payload.players] - Array of player data
   * @param {Array} [payload.logEntries] - Array of log entries
   * @param {Object} [payload.deck] - Deck data
   * @param {Object} [payload.state] - Session state data
   */
  const applySessionPayload = useCallback((payload) => {
    if (!payload) {
      return;
    }

    const players = Array.isArray(payload.players) ? payload.players : [];
    const entries = Array.isArray(payload.logEntries) ? payload.logEntries : [];
    const deck = payload.deck ?? null;
    const state = payload.state ?? null;

    const snapshot = {
      players,
      logEntries: entries,
      deck,
      state: state ?? null,
    };

    setCurrentSnapshot(snapshot);
    setGameState(state ?? null);
    setActivePlayers(players);
    setDeckView(buildDeckView(deck));
    setLogEntries(entries);
  }, []);

  /**
   * Handles starting the game in the current room.
   */
  const handleStartGame = async () => {
    try {
      const {
        players,
        logEntries: entries,
        deck,
        state,
      } = await RoomApi.startGame(roomId);

      setErrorMessage("");
      applySessionPayload({
        players,
        logEntries: entries,
        deck,
        state,
      });
      // Update room state immediately for UI feedback before async refresh
      setRoomState((prev) => ({
        ...prev,
        canAddPlayer: false,
        canStartGame: false,
        gameStarted: true,
      }));
      loadRoomState(roomId, { silent: true });
      consoleLogger.info(
        `Client event: started game in room '${roomId}' with ${
          Array.isArray(players) ? players.length : 0
        } players`
      );
    } catch (error) {
      consoleLogger.error("Unable to start Skyjo game", error);
      setErrorMessage(getErrorMessage(error));
      resetGameState(
        setCurrentSnapshot,
        setGameState,
        setLogEntries,
        setActivePlayers,
        setDeckView
      );
    }
  };

  /**
   * Handles revealing an initial card during the setup phase.
   * @param {string} playerName - The name of the player revealing the card
   * @param {number} position - The position of the card to reveal
   */
  const handleRevealInitialCard = async (playerName, position) => {
    if (!roomId) {
      return;
    }

    setIsProcessing(true);
    try {
      const {
        players = [],
        logEntries: entries = [],
        deck = null,
        state = null,
      } = await RoomApi.revealInitialCard(roomId, playerName, position);

      applySessionPayload({
        players,
        logEntries: entries,
        deck,
        state,
      });
      setErrorMessage("");
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Handles drawing a card from deck or discard pile.
   * @param {string} playerName - The name of the player drawing the card
   * @param {string} source - The source of the card ("deck" or "discard")
   */
  const handleDrawCard = async (playerName, source) => {
    if (!roomId) {
      return;
    }

    setIsProcessing(true);
    try {
      const payload = await RoomApi.drawCard(roomId, playerName, source);
      applySessionPayload(payload);
      setErrorMessage("");
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Handles restarting the game with the same players (rematch).
   */
  const handlePlayAgain = async () => {
    if (!roomId) {
      return;
    }
    const preservedNames = normalizePlayerNames(playerNames);
    if (preservedNames.length === 0) {
      setErrorMessage("Cannot restart without players in the room.");
      return;
    }

    setIsProcessing(true);
    try {
      try {
        await RoomApi.resetRoom(roomId);
      } catch (resetError) {
        consoleLogger.warn(
          "Client warning: unable to reset room before rematch",
          resetError
        );
      }
      await RoomApi.createRoom(roomId);
      let latestPlayers = preservedNames;
      for (const name of preservedNames) {
        const { players: updatedNames = [] } = await RoomApi.joinRoom(
          roomId,
          name
        );
        if (Array.isArray(updatedNames) && updatedNames.length > 0) {
          latestPlayers = updatedNames;
        }
      }
      const safePlayers = Array.isArray(latestPlayers) ? latestPlayers : [];
      setPlayerNames(safePlayers);
      setRoomState(createRoomState(safePlayers, skyjo, false));
      await handleStartGame();
      setErrorMessage("");
    } catch (error) {
      consoleLogger.error("Unable to restart game automatically", error);
      setErrorMessage(
        getErrorMessage(error) || "Unable to restart the game automatically."
      );
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Handles replacing a card with the drawn card.
   * @param {string} playerName - The name of the player replacing the card
   * @param {number} position - The position of the card to replace
   */
  const handleReplaceWithDrawnCard = async (playerName, position) => {
    if (!roomId) {
      return;
    }

    setIsProcessing(true);
    try {
      const payload = await RoomApi.replaceWithDrawnCard(
        roomId,
        playerName,
        position
      );
      applySessionPayload(payload);
      setErrorMessage("");
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Handles revealing a card after discarding the drawn card.
   * @param {string} playerName - The name of the player revealing the card
   * @param {number} position - The position of the card to reveal
   */
  const handleRevealAfterDiscard = async (playerName, position) => {
    if (!roomId) {
      return;
    }

    setIsProcessing(true);
    try {
      const payload = await RoomApi.revealAfterDiscard(
        roomId,
        playerName,
        position
      );
      applySessionPayload(payload);
      setErrorMessage("");
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsProcessing(false);
    }
  };

  // Player name validation
  const trimmedPlayerName = normalizePlayerName(newPlayerName);
  const validationResult = validatePlayerName(
    trimmedPlayerName,
    GameSession.MAX_PLAYER_NAME_LENGTH
  );
  const isPlayerNameValid = validationResult.isValid;

  /**
   * Validates player name and sets error message if invalid.
   * @param {string} playerName - The player name to validate (optional, defaults to current newPlayerName)
   * @returns {boolean} True if player name is valid
   */
  const ensureValidPlayerName = (playerName = newPlayerName) => {
    const normalized = normalizePlayerName(playerName);
    const result = validatePlayerName(
      normalized,
      GameSession.MAX_PLAYER_NAME_LENGTH
    );
    setErrorMessage(result.errorMessage);
    return result.isValid;
  };

  /**
   * Handles joining an existing room from URL invite link.
   */
  const handleJoinRoom = async () => {
    const currentPlayerName = normalizePlayerName(newPlayerName);
    if (!ensureValidPlayerName(currentPlayerName)) {
      return;
    }

    if (!isJoiningExistingRoom) {
      // Should only be called when joining from URL
      return;
    }

    const normalizedRoomId = normalizeRoomId(roomId);
    if (!normalizedRoomId) {
      setErrorMessage("Room ID must not be empty to join.");
      return;
    }
    setIsProcessing(true);
    try {
      consoleLogger.info(
        `Client action: attempting to join room '${normalizedRoomId}' as '${currentPlayerName}'`
      );
      try {
        await RoomApi.getRoom(normalizedRoomId);
      } catch (lookupError) {
        setErrorMessage(getErrorMessage(lookupError));
        setIsProcessing(false);
        return;
      }

      const {
        players: updatedNames = [],
        roomId: joinedRoomId = normalizedRoomId,
      } = await RoomApi.joinRoom(normalizedRoomId, currentPlayerName);
      setRoomId(joinedRoomId);
      syncRoomIdToUrl(joinedRoomId);
      setLocalPlayerName(currentPlayerName);
      const safePlayers = Array.isArray(updatedNames) ? updatedNames : [];
      setPlayerNames(safePlayers);
      setRoomState(createRoomState(safePlayers, skyjo, false));
      setErrorMessage("");
      setNewPlayerName(currentPlayerName);
      setIsJoiningExistingRoom(false);
      setHasCreatedRoom(false);
      setCurrentSnapshot(null);
      setGameState(null);
      consoleLogger.info(
        `Client event: joined room '${joinedRoomId}' as '${currentPlayerName}'. Total players: ${updatedNames.length}`
      );
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Handles player name input changes with length validation.
   * @param {string} value - The new player name value
   */
  const handleNewPlayerNameChange = (value) => {
    if (typeof value !== "string") {
      setNewPlayerName("");
      return;
    }
    const capped = value.slice(0, GameSession.MAX_PLAYER_NAME_LENGTH);
    setNewPlayerName(capped);
  };

  /**
   * Handles creating a new room and joining as the first player.
   */
  const handleCreateRoom = async () => {
    const currentPlayerName = normalizePlayerName(newPlayerName);
    if (!ensureValidPlayerName(currentPlayerName)) {
      return;
    }
    setIsJoiningExistingRoom(false);
    setIsProcessing(true);
    try {
      consoleLogger.info(
        `Client action: creating new room as '${currentPlayerName}'`
      );
      const { roomId: createdId = generateRoomId() } =
        await RoomApi.createRoom();
      const normalizedId = normalizeRoomId(createdId);
      const { players: updatedNames = [] } = await RoomApi.joinRoom(
        normalizedId,
        currentPlayerName
      );
      setErrorMessage("");
      setRoomId(normalizedId);
      syncRoomIdToUrl(normalizedId);
      setLocalPlayerName(currentPlayerName);
      const safePlayers = Array.isArray(updatedNames) ? updatedNames : [];
      setPlayerNames(safePlayers);
      setRoomState(createRoomState(safePlayers, skyjo, false));
      resetGameState(
        setCurrentSnapshot,
        setGameState,
        setLogEntries,
        setActivePlayers,
        setDeckView
      );
      setNewPlayerName(currentPlayerName);
      setHasCreatedRoom(true);
      let lanHostForCopy = undefined;
      if (
        !lanHostSkipped &&
        !lanHost &&
        typeof window !== "undefined" &&
        window.prompt
      ) {
        const promptResult = window.prompt(
          "Optional: enter the local IP address so other devices on your Wi-Fi can join (or leave blank to skip)",
          ""
        );
        if (promptResult && promptResult.trim().length > 0) {
          const trimmed = promptResult.trim();
          setLanHost(trimmed);
          lanHostForCopy = trimmed;
          try {
            window.localStorage?.setItem("skyjo:lanHost", trimmed);
          } catch (storageError) {
            consoleLogger.warn("Unable to persist LAN host", storageError);
          }
        } else {
          setLanHostSkipped(true);
        }
      }
      consoleLogger.info(
        `Client event: created room '${normalizedId}' and joined as '${currentPlayerName}'. Total players: ${updatedNames.length}`
      );
      await copyInviteLinkToClipboard({
        roomIdToCopy: normalizedId,
        hostOverride: lanHostForCopy,
      });
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Copies the invite link to clipboard, handling local network IP resolution.
   * @param {Object} [options={}] - Options object
   * @param {string} [options.roomIdToCopy] - Room ID to copy (defaults to current roomId)
   * @param {string} [options.hostOverride] - Override host for local network
   */
  const copyInviteLinkToClipboard = async ({
    roomIdToCopy,
    hostOverride,
  } = {}) => {
    const targetRoomId = roomIdToCopy ?? roomId;
    if (!targetRoomId) {
      return;
    }
    try {
      if (
        typeof navigator !== "undefined" &&
        navigator.clipboard &&
        typeof navigator.clipboard.writeText === "function"
      ) {
        let inviteLink = targetRoomId;
        if (
          typeof window !== "undefined" &&
          typeof window.location === "object"
        ) {
          try {
            const url = new URL(window.location.href);
            url.searchParams.set("roomId", targetRoomId);
            const hostname = window.location.hostname;
            const isLocalHost =
              hostname === "localhost" ||
              hostname === "127.0.0.1" ||
              hostname === "0.0.0.0";
            if (isLocalHost) {
              const port = window.location.port || "4000";
              let resolvedHost = hostOverride ?? lanHost;
              if (typeof window !== "undefined" && window.localStorage) {
                if (!resolvedHost) {
                  const storedHost =
                    window.localStorage.getItem("skyjo:lanHost");
                  if (storedHost && storedHost.length > 0) {
                    resolvedHost = storedHost;
                    setLanHost(storedHost);
                  }
                }
                if (!resolvedHost && !lanHostSkipped && window.prompt) {
                  const prompted = window.prompt(
                    "Enter your local network IP so other devices can connect (leave blank to skip)",
                    hostname
                  );
                  if (prompted && prompted.trim().length > 0) {
                    resolvedHost = prompted.trim();
                    setLanHost(resolvedHost);
                    window.localStorage.setItem("skyjo:lanHost", resolvedHost);
                  } else {
                    setLanHostSkipped(true);
                  }
                }
              }
              inviteLink = resolvedHost
                ? `http://${resolvedHost}:${port}/?roomId=${targetRoomId}`
                : url.toString();
            } else {
              inviteLink = url.toString();
            }
          } catch (error) {
            consoleLogger.error("Failed to build invite link", error);
          }
        }
        await navigator.clipboard.writeText(inviteLink);
      } else {
        throw new Error("Clipboard not supported.");
      }
    } catch (error) {
      setErrorMessage(getErrorMessage(error) || "Unable to copy join link.");
    }
  };

  if (gameState !== null) {
    return React.createElement(GamePlayView, {
      activePlayers,
      deck: deckView,
      snapshot: currentSnapshot,
      gameState,
      logEntries,
      onFlipCard: handleRevealInitialCard,
      onDrawCard: handleDrawCard,
      onReplaceCard: handleReplaceWithDrawnCard,
      onRevealCard: handleRevealAfterDiscard,
      onPlayAgain: handlePlayAgain,
      localPlayerName,
      isProcessing,
    });
  }

  return React.createElement(GameSetupView, {
    isProcessing,
    roomId,
    gameStarted: roomState.gameStarted,
    isJoiningRoom: isJoiningExistingRoom,
    hasCreatedRoom,
    isPlayerNameValid,
    playerName: newPlayerName,
    onCreateRoom: handleCreateRoom,
    onJoinRoom: handleJoinRoom,
    onCopyRoomId: copyInviteLinkToClipboard,
    playerNames,
    playerColors,
    onPlayerNameChange: handleNewPlayerNameChange,
    onStartGame: handleStartGame,
    canStartGame: roomState.canStartGame,
    errorMessage,
  });
}
