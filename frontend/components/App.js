import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "https://esm.sh/react@18?dev";

import { Game } from "../../shared/models/game.js";
import { consoleLogger } from "../../shared/logger.js";
import { generateRoomId } from "../../shared/generateRoomId.js";
import { buildPlayerColors } from "../../shared/utils/playerColors.js";
import { RoomApi } from "../services/RoomApi.js";
import { gamePlayView } from "./gamePlayView.js";
import { gameSetupView } from "./gameSetupView.js";
import {
  buildDeckView,
  normalizePlayerSnapshots,
} from "../utils/appHelpers.js";

/**
 * Helper function to extract error message from error objects.
 * @param {Error|unknown} error - The error object or value
 * @returns {string} The error message string
 */
const getErrorMessage = (error) => {
  return error instanceof Error ? error.message : String(error);
};

/**
 * Helper function to normalize room ID (trim and uppercase).
 * @param {string} roomId - The room ID to normalize
 * @returns {string} Normalized room ID or empty string
 */
const normalizeRoomId = (roomId) => {
  return typeof roomId === "string" && roomId.trim().length > 0
    ? roomId.trim().toUpperCase()
    : "";
};

/**
 * Helper function to reset game state to initial values.
 * @param {Function} setCurrentSnapshot - State setter for current snapshot
 * @param {Function} setSessionState - State setter for session state
 * @param {Function} setGameStarted - State setter for game started flag
 * @param {Function} setLogEntries - State setter for log entries
 * @param {Function} setActivePlayers - State setter for active players
 * @param {Function} setDeckView - State setter for deck view
 */
const resetGameState = (
  setCurrentSnapshot,
  setSessionState,
  setGameStarted,
  setLogEntries,
  setActivePlayers,
  setDeckView
) => {
  setCurrentSnapshot(null);
  setSessionState(null);
  setGameStarted(false);
  setLogEntries([]);
  setActivePlayers([]);
  setDeckView(null);
};

/**
 * Helper function to create room state object with player validation.
 * @param {string[]} players - Array of player names
 * @param {Game} game - The game instance with min/max player constraints
 * @param {boolean} gameStarted - Whether the game has started
 * @returns {Object} Room state object
 */
const createRoomState = (players, game, gameStarted = false) => {
  return {
    players,
    canAddPlayer: players.length < game.maxPlayers,
    canStartGame: players.length >= game.minPlayers,
    gameStarted,
  };
};

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
  const [roomId, setRoomId] = useState("");
  const [roomIdInput, setRoomIdInput] = useState("");
  const [roomState, setRoomState] = useState({
    players: [],
    canAddPlayer: true,
    canStartGame: false,
    gameStarted: false,
  });

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Player management state
  const [playerNames, setPlayerNames] = useState([]);
  const [newPlayerName, setNewPlayerName] = useState("");
  const [localPlayerName, setLocalPlayerName] = useState("");

  // Game state
  const [gameStarted, setGameStarted] = useState(false);
  const [activePlayers, setActivePlayers] = useState([]);
  const [deckView, setDeckView] = useState(null);
  const [currentSnapshot, setCurrentSnapshot] = useState(null);
  const [sessionState, setSessionState] = useState(null);
  const [logEntries, setLogEntries] = useState([]);
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);

  // Room flow state
  const [isJoiningExistingRoom, setIsJoiningExistingRoom] = useState(false);
  const [hasCreatedRoom, setHasCreatedRoom] = useState(false);
  const [isRoomSelectionLocked, setIsRoomSelectionLocked] = useState(false);
  const [isInviteLink, setIsInviteLink] = useState(false);
  const [hasExistingRooms, setHasExistingRooms] = useState(true);

  // LAN host configuration for local network sharing
  const [lanHost, setLanHost] = useState(() => {
    if (typeof window !== "undefined" && window.localStorage) {
      return window.localStorage.getItem("skyjo:lanHost") ?? "";
    }
    return "";
  });
  const [lanHostSkipped, setLanHostSkipped] = useState(false);

  // Refs for tracking state across renders
  const loggedEventCountRef = useRef(0);
  const activeRoomIdRef = useRef(roomId);
  const isFetchingRoomRef = useRef(false);

  // Keep ref in sync with roomId for async operations
  useEffect(() => {
    activeRoomIdRef.current = roomId;
  }, [roomId]);

  // Parse URL parameters on mount to support invite links
  useEffect(() => {
    if (typeof window === "undefined" || typeof window.location !== "object") {
      return;
    }

    try {
      const params = new URLSearchParams(window.location.search);
      const urlRoomId = params.get("roomId") ?? params.get("room");
      const urlName = params.get("name");

      if (urlRoomId) {
        const normalized = normalizeRoomId(urlRoomId);
        setRoomIdInput((prev) => (prev ? prev : normalized));
        setIsJoiningExistingRoom(true);
        setIsRoomSelectionLocked(true);
        setHasCreatedRoom(false);
        setIsInviteLink(true);
      }

      if (urlName) {
        const cappedName = urlName.slice(0, 15);
        setNewPlayerName((prev) => (prev ? prev : cappedName));
      }
    } catch (error) {
      consoleLogger.error("Failed to parse join parameters from URL", error);
    }
  }, []);

  // Sync room ID with URL query parameters
  useEffect(() => {
    if (
      typeof window === "undefined" ||
      typeof window.history?.replaceState !== "function"
    ) {
      return;
    }

    try {
      const url = new URL(window.location.href);
      if (roomId) {
        url.searchParams.set("roomId", roomId);
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
  }, [roomId]);

  // Log new log entries to console
  useEffect(() => {
    if (!Array.isArray(logEntries) || logEntries.length === 0) {
      loggedEventCountRef.current = 0;
      return;
    }

    const startIndex = Math.max(0, loggedEventCountRef.current);
    const newEntries = logEntries.slice(startIndex);

    newEntries.forEach((entry) => {
      const message =
        entry && typeof entry === "object" && entry !== null
          ? (entry.message ?? "")
          : entry;
      consoleLogger.info(`Client event: ${message}`);
    });

    loggedEventCountRef.current = logEntries.length;
  }, [logEntries]);

  // Check for existing rooms on mount to show/hide join button
  useEffect(() => {
    let cancelled = false;
    const fetchExistingRooms = async () => {
      try {
        const payload = await RoomApi.listRooms();
        if (cancelled) {
          return;
        }
        const rooms = Array.isArray(payload?.rooms) ? payload.rooms : [];
        setHasExistingRooms(rooms.length > 0);
      } catch (error) {
        consoleLogger.warn("Client warning: unable to list rooms", error);
      }
    };
    fetchExistingRooms();
    return () => {
      cancelled = true;
    };
  }, []);

  /**
   * Loads room state from the server and updates local state.
   * @param {string} [targetRoomId=roomId] - The room ID to load
   * @param {Object} [options={}] - Options object
   * @param {boolean} [options.silent=false] - If true, don't show loading indicator
   * @param {boolean} [options.preservePlayerName=false] - If true, don't clear player name input
   */
  const loadRoomState = useCallback(
    async (
      targetRoomId = roomId,
      { silent = false, preservePlayerName = false } = {}
    ) => {
      const normalizedRoomId = normalizeRoomId(targetRoomId) || roomId;

      if (!normalizedRoomId) {
        return;
      }

      if (silent && isFetchingRoomRef.current) {
        return;
      }

      isFetchingRoomRef.current = true;
      if (!silent) {
        setIsLoading(true);
        consoleLogger.info(`Client action: loading room '${normalizedRoomId}'`);
      }

      try {
        const data = await RoomApi.getRoom(normalizedRoomId);
        if (activeRoomIdRef.current !== normalizedRoomId) {
          return;
        }

        setRoomState(
          createRoomState(data.players ?? [], skyjo, Boolean(data.gameStarted))
        );
        setPlayerNames(data.players ?? []);
        setErrorMessage("");

        const snapshot = data.snapshot ?? null;
        if (snapshot) {
          setCurrentSnapshot(snapshot);
          setSessionState(snapshot.state ?? null);
          setGameStarted(true);
          setLogEntries(
            Array.isArray(snapshot.logEntries) ? snapshot.logEntries : []
          );
          setActivePlayers(normalizePlayerSnapshots(snapshot.players));
          setDeckView(buildDeckView(snapshot.deck));
        } else {
          resetGameState(
            setCurrentSnapshot,
            setSessionState,
            setGameStarted,
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
        if (activeRoomIdRef.current !== normalizedRoomId) {
          return;
        }

        consoleLogger.error("Failed to load room state", error);
        if (!silent) {
          setErrorMessage(getErrorMessage(error));
          setRoomState(createRoomState([], skyjo, false));
          setPlayerNames([]);
          resetGameState(
            setCurrentSnapshot,
            setSessionState,
            setGameStarted,
            setLogEntries,
            setActivePlayers,
            setDeckView
          );
        }
      } finally {
        if (activeRoomIdRef.current === normalizedRoomId && !silent) {
          setIsLoading(false);
        }
        isFetchingRoomRef.current = false;
      }
    },
    [roomId]
  );

  // Set up timers for pending column removals to refresh room state
  useEffect(() => {
    if (!roomId) {
      return;
    }
    const pendingRemovals = Array.isArray(sessionState?.pendingColumnRemovals)
      ? sessionState.pendingColumnRemovals
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
        const delay = Math.max(expiresAt - now + 50, 0);
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
  }, [roomId, sessionState?.pendingColumnRemovals, loadRoomState]);

  // Load room state when room ID changes
  useEffect(() => {
    if (!roomId) {
      return;
    }

    loadRoomState(roomId, {
      silent: false,
      preservePlayerName:
        hasCreatedRoom || isJoiningExistingRoom || isRoomSelectionLocked,
    });
  }, [
    roomId,
    loadRoomState,
    hasCreatedRoom,
    isJoiningExistingRoom,
    isRoomSelectionLocked,
  ]);

  // Poll room state every 4 seconds to keep UI in sync
  useEffect(() => {
    if (!roomId) {
      return;
    }

    const intervalId = setInterval(() => {
      loadRoomState(roomId, { silent: true });
    }, 4000);

    return () => {
      clearInterval(intervalId);
    };
  }, [roomId, loadRoomState]);

  // Update document title with room and player info
  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    const titleParts = ["Skyjo"];
    const normalizedRoomId = normalizeRoomId(roomId);
    const normalizedPlayerName =
      typeof localPlayerName === "string" && localPlayerName.trim().length > 0
        ? localPlayerName.trim()
        : "";

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
    setSessionState(state ?? null);
    setActivePlayers(normalizePlayerSnapshots(players));
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
      setGameStarted(true);
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
        setSessionState,
        setGameStarted,
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

    setIsSubmittingAction(true);
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
      setIsSubmittingAction(false);
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

    setIsSubmittingAction(true);
    try {
      const payload = await RoomApi.drawCard(roomId, playerName, source);
      applySessionPayload(payload);
      setErrorMessage("");
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsSubmittingAction(false);
    }
  };

  /**
   * Handles restarting the game with the same players (rematch).
   */
  const handlePlayAgain = async () => {
    if (!roomId) {
      return;
    }
    const preservedNames = playerNames
      .map((name) => (typeof name === "string" ? name.trim() : ""))
      .filter((name) => name.length > 0);
    if (preservedNames.length === 0) {
      setErrorMessage("Cannot restart without players in the room.");
      return;
    }

    setIsSubmittingAction(true);
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
        if (updatedNames.length > 0) {
          latestPlayers = updatedNames;
        }
      }
      setPlayerNames(latestPlayers);
      setRoomState(createRoomState(latestPlayers, skyjo, false));
      await handleStartGame();
      setErrorMessage("");
    } catch (error) {
      consoleLogger.error("Unable to restart game automatically", error);
      setErrorMessage(
        getErrorMessage(error) || "Unable to restart the game automatically."
      );
    } finally {
      setIsSubmittingAction(false);
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

    setIsSubmittingAction(true);
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
      setIsSubmittingAction(false);
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

    setIsSubmittingAction(true);
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
      setIsSubmittingAction(false);
    }
  };

  // Player name validation
  const trimmedPlayerName = newPlayerName.trim();
  const playerNameLength = trimmedPlayerName.length;
  const isPlayerNameValid = playerNameLength > 0 && playerNameLength <= 15;

  /**
   * Validates player name and sets error message if invalid.
   * @returns {boolean} True if player name is valid
   */
  const ensureValidPlayerName = () => {
    if (playerNameLength === 0) {
      setErrorMessage("Player name must not be empty.");
      return false;
    }
    if (playerNameLength > 15) {
      setErrorMessage("Player name must be 15 characters or fewer.");
      return false;
    }
    setErrorMessage("");
    return true;
  };

  // Reset room flow state when player name becomes invalid
  useEffect(() => {
    if (!isPlayerNameValid && isJoiningExistingRoom) {
      if (!isInviteLink) {
        setIsJoiningExistingRoom(false);
        setRoomIdInput(normalizeRoomId(roomId ?? ""));
      }
    }
    if (!isPlayerNameValid && hasCreatedRoom) {
      setHasCreatedRoom(false);
    }
    if (!isPlayerNameValid && isRoomSelectionLocked) {
      if (!isInviteLink) {
        setIsRoomSelectionLocked(false);
      }
    }
  }, [
    isPlayerNameValid,
    isJoiningExistingRoom,
    roomId,
    hasCreatedRoom,
    isRoomSelectionLocked,
    isInviteLink,
  ]);

  /**
   * Handles joining an existing room or initiating the join flow.
   */
  const handleJoinRoom = async () => {
    if (!ensureValidPlayerName()) {
      return;
    }

    if (!isJoiningExistingRoom) {
      setIsJoiningExistingRoom(true);
      setIsRoomSelectionLocked(true);
      setErrorMessage("");
      setHasCreatedRoom(false);
      return;
    }

    const normalizedRoomId = normalizeRoomId(roomIdInput);
    if (!normalizedRoomId) {
      setErrorMessage("Room ID must not be empty to join.");
      return;
    }

    setIsLoading(true);
    try {
      consoleLogger.info(
        `Client action: attempting to join room '${normalizedRoomId}' as '${trimmedPlayerName}'`
      );
      try {
        await RoomApi.getRoom(normalizedRoomId);
      } catch (lookupError) {
        setErrorMessage(getErrorMessage(lookupError));
        setIsLoading(false);
        return;
      }

      const {
        players: updatedNames = [],
        roomId: joinedRoomId = normalizedRoomId,
      } = await RoomApi.joinRoom(normalizedRoomId, trimmedPlayerName);
      setRoomId(joinedRoomId);
      setRoomIdInput(joinedRoomId);
      setLocalPlayerName(trimmedPlayerName);
      setPlayerNames(updatedNames);
      setRoomState(createRoomState(updatedNames, skyjo, false));
      setErrorMessage("");
      setNewPlayerName(trimmedPlayerName);
      setIsJoiningExistingRoom(false);
      setHasCreatedRoom(false);
      setHasExistingRooms(true);
      setCurrentSnapshot(null);
      setSessionState(null);
      consoleLogger.info(
        `Client event: joined room '${joinedRoomId}' as '${trimmedPlayerName}'. Total players: ${updatedNames.length}`
      );
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsLoading(false);
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
    const capped = value.slice(0, 15);
    setNewPlayerName(capped);
  };

  /**
   * Handles room ID input changes, converting to uppercase.
   * @param {string} value - The new room ID value
   */
  const handleRoomIdInputChange = (value) => {
    setRoomIdInput(value.toUpperCase());
  };

  /**
   * Handles creating a new room and joining as the first player.
   */
  const handleCreateRoom = async () => {
    if (!ensureValidPlayerName()) {
      return;
    }
    setIsJoiningExistingRoom(false);
    setIsRoomSelectionLocked(true);
    setIsLoading(true);
    try {
      consoleLogger.info(
        `Client action: creating new room as '${trimmedPlayerName}'`
      );
      const { roomId: createdId = generateRoomId() } =
        await RoomApi.createRoom();
      const normalizedId = normalizeRoomId(createdId);
      const { players: updatedNames = [], roomId: finalRoomId = normalizedId } =
        await RoomApi.joinRoom(normalizedId, trimmedPlayerName);
      setErrorMessage("");
      setRoomId(finalRoomId);
      setRoomIdInput(finalRoomId);
      setLocalPlayerName(trimmedPlayerName);
      setPlayerNames(updatedNames);
      setRoomState(createRoomState(updatedNames, skyjo, false));
      resetGameState(
        setCurrentSnapshot,
        setSessionState,
        setGameStarted,
        setLogEntries,
        setActivePlayers,
        setDeckView
      );
      setNewPlayerName(trimmedPlayerName);
      setHasCreatedRoom(true);
      setHasExistingRooms(true);
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
        `Client event: created room '${finalRoomId}' and joined as '${trimmedPlayerName}'. Total players: ${updatedNames.length}`
      );
      await copyInviteLinkToClipboard({
        roomIdToCopy: finalRoomId,
        hostOverride: lanHostForCopy,
      });
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsLoading(false);
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

  /**
   * Handles copying the current room ID to clipboard.
   */
  const handleCopyRoomId = async () => {
    await copyInviteLinkToClipboard();
  };

  if (gameStarted) {
    return React.createElement(gamePlayView, {
      activePlayers,
      deck: deckView,
      snapshot: currentSnapshot,
      sessionState,
      logEntries,
      onFlipCard: handleRevealInitialCard,
      onDrawCard: handleDrawCard,
      onReplaceCard: handleReplaceWithDrawnCard,
      onRevealCard: handleRevealAfterDiscard,
      onPlayAgain: handlePlayAgain,
      localPlayerName,
      isSubmittingAction,
    });
  }

  return React.createElement(gameSetupView, {
    isLoading,
    roomId,
    roomIdInput,
    gameStarted: roomState.gameStarted,
    isJoiningRoom: isJoiningExistingRoom,
    hasCreatedRoom,
    isRoomSelectionLocked,
    isPlayerNameValid,
    hasExistingRooms,
    playerName: newPlayerName,
    onRoomIdInputChange: handleRoomIdInputChange,
    onCreateRoom: handleCreateRoom,
    onJoinRoom: handleJoinRoom,
    onCopyRoomId: handleCopyRoomId,
    playerNames,
    playerColors,
    onPlayerNameChange: handleNewPlayerNameChange,
    onStartGame: handleStartGame,
    canStartGame: roomState.canStartGame,
    errorMessage,
    isRoomIdReadOnly: isInviteLink && isJoiningExistingRoom,
  });
}
