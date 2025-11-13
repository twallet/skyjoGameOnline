import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "https://esm.sh/react@18?dev";

import { Game } from "../models/game.js";
import { consoleLogger } from "../utils/logger.js";
import { generateRoomId } from "../utils/id.js";
import { RoomApi } from "../services/RoomApi.js";
import { GamePlayView } from "./GamePlayView.js";
import { GameSetupView } from "./GameSetupView.js";
import { buildDeckView, normalizePlayerSnapshots } from "./appHelpers.js";

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

export function App() {
  const playerColors = useMemo(() => {
    return Array.from({ length: skyjo.maxPlayers }, (_, index) => {
      const hue = Math.round((index * 360) / skyjo.maxPlayers);
      return `hsl(${hue}, 70%, 85%)`;
    });
  }, []);
  const [roomId, setRoomId] = useState("");
  const [roomIdInput, setRoomIdInput] = useState("");
  const [roomState, setRoomState] = useState({
    players: [],
    canAddPlayer: true,
    canStartGame: false,
    gameStarted: false,
  });
  const [isLoading, setIsLoading] = useState(false);

  const [logEntries, setLogEntries] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [playerNames, setPlayerNames] = useState([]);
  const [newPlayerName, setNewPlayerName] = useState("");
  const [gameStarted, setGameStarted] = useState(false);
  const [activePlayers, setActivePlayers] = useState([]);
  const [deckView, setDeckView] = useState(null);
  const [currentSnapshot, setCurrentSnapshot] = useState(null);
  const [sessionState, setSessionState] = useState(null);
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);
  const [localPlayerName, setLocalPlayerName] = useState("");
  const [isJoiningExistingRoom, setIsJoiningExistingRoom] = useState(false);
  const [hasCreatedRoom, setHasCreatedRoom] = useState(false);
  const [isRoomSelectionLocked, setIsRoomSelectionLocked] = useState(false);
  const [isInviteLink, setIsInviteLink] = useState(false);
  const [lanHost, setLanHost] = useState(() => {
    if (typeof window !== "undefined" && window.localStorage) {
      return window.localStorage.getItem("skyjo:lanHost") ?? "";
    }
    return "";
  });
  const [lanHostSkipped, setLanHostSkipped] = useState(false);

  const loggedEventCountRef = useRef(0);
  const activeRoomIdRef = useRef(roomId);
  const isFetchingRoomRef = useRef(false);

  useEffect(() => {
    activeRoomIdRef.current = roomId;
  }, [roomId]);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.location !== "object") {
      return;
    }

    try {
      const params = new URLSearchParams(window.location.search);
      const urlRoomId = params.get("roomId") ?? params.get("room");
      const urlName = params.get("name");

      if (urlRoomId) {
        const normalized = urlRoomId.trim().toUpperCase();
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

  const loadRoomState = useCallback(
    async (
      targetRoomId = roomId,
      { silent = false, preservePlayerName = false } = {}
    ) => {
      const normalizedRoomId =
        typeof targetRoomId === "string" && targetRoomId.trim().length > 0
          ? targetRoomId.trim().toUpperCase()
          : roomId;

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

        setRoomState({
          players: data.players ?? [],
          canAddPlayer: Boolean(data.canAddPlayer),
          canStartGame: Boolean(data.canStartGame),
          gameStarted: Boolean(data.gameStarted),
        });
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
          setCurrentSnapshot(null);
          setSessionState(null);
          setGameStarted(false);
          setLogEntries([]);
          setActivePlayers([]);
          setDeckView(null);
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
          setErrorMessage(
            error instanceof Error ? error.message : String(error)
          );
          setRoomState({
            players: [],
            canAddPlayer: true,
            canStartGame: false,
          });
          setPlayerNames([]);
          setLogEntries([]);
          setActivePlayers([]);
          setDeckView(null);
          setGameStarted(false);
          setCurrentSnapshot(null);
          setSessionState(null);
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

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    const titleParts = ["Skyjo"];
    const normalizedRoomId =
      typeof roomId === "string" && roomId.trim().length > 0
        ? roomId.trim().toUpperCase()
        : "";
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
      setErrorMessage(error instanceof Error ? error.message : String(error));
      setGameStarted(false);
      setCurrentSnapshot(null);
      setSessionState(null);
      setActivePlayers([]);
      setDeckView(null);
      setLogEntries([]);
    }
  };

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
      setErrorMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setIsSubmittingAction(false);
    }
  };

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
      setErrorMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setIsSubmittingAction(false);
    }
  };

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
      setErrorMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setIsSubmittingAction(false);
    }
  };

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
      setErrorMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const trimmedPlayerName = newPlayerName.trim();
  const playerNameLength = trimmedPlayerName.length;
  const isPlayerNameValid = playerNameLength > 0 && playerNameLength <= 15;

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

  useEffect(() => {
    if (!isPlayerNameValid && isJoiningExistingRoom) {
      if (!isInviteLink) {
        setIsJoiningExistingRoom(false);
        setRoomIdInput((roomId ?? "").toUpperCase());
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

    const normalizedRoomId = roomIdInput.trim().toUpperCase();
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
        setErrorMessage(
          lookupError instanceof Error
            ? lookupError.message
            : String(lookupError)
        );
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
      setRoomState((prev) => ({
        ...prev,
        players: updatedNames,
        canAddPlayer: updatedNames.length < skyjo.maxPlayers,
        canStartGame: updatedNames.length >= skyjo.minPlayers,
        gameStarted: false,
      }));
      setErrorMessage("");
      setNewPlayerName(trimmedPlayerName);
      setIsJoiningExistingRoom(false);
      setHasCreatedRoom(false);
      setCurrentSnapshot(null);
      setSessionState(null);
      consoleLogger.info(
        `Client event: joined room '${joinedRoomId}' as '${trimmedPlayerName}'. Total players: ${updatedNames.length}`
      );
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewPlayerNameChange = (value) => {
    if (typeof value !== "string") {
      setNewPlayerName("");
      return;
    }
    const capped = value.slice(0, 15);
    setNewPlayerName(capped);
  };

  const handleRoomIdInputChange = (value) => {
    setRoomIdInput(value.toUpperCase());
  };

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
      const normalizedId = createdId.trim().toUpperCase();
      const { players: updatedNames = [], roomId: finalRoomId = normalizedId } =
        await RoomApi.joinRoom(normalizedId, trimmedPlayerName);
      setErrorMessage("");
      setRoomId(finalRoomId);
      setRoomIdInput(finalRoomId);
      setLocalPlayerName(trimmedPlayerName);
      setPlayerNames(updatedNames);
      setRoomState((prev) => ({
        ...prev,
        players: updatedNames,
        canAddPlayer: updatedNames.length < skyjo.maxPlayers,
        canStartGame: updatedNames.length >= skyjo.minPlayers,
        gameStarted: false,
      }));
      setLogEntries([]);
      setActivePlayers([]);
      setDeckView(null);
      setGameStarted(false);
      setNewPlayerName(trimmedPlayerName);
      setHasCreatedRoom(true);
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
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyRoomId = async () => {
    if (!roomId) {
      return;
    }
    try {
      if (
        typeof navigator !== "undefined" &&
        navigator.clipboard &&
        typeof navigator.clipboard.writeText === "function"
      ) {
        let inviteLink = roomId;
        if (
          typeof window !== "undefined" &&
          typeof window.location === "object"
        ) {
          try {
            const url = new URL(window.location.href);
            url.searchParams.set("roomId", roomId);
            const hostname = window.location.hostname;
            const isLocalHost =
              hostname === "localhost" ||
              hostname === "127.0.0.1" ||
              hostname === "0.0.0.0";
            if (isLocalHost) {
              const port = window.location.port || "4000";
              let resolvedHost = lanHost;
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
                ? `http://${resolvedHost}:${port}/?roomId=${roomId}`
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
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to copy join link."
      );
    }
  };

  if (gameStarted) {
    return React.createElement(GamePlayView, {
      activePlayers,
      deck: deckView,
      snapshot: currentSnapshot,
      sessionState,
      logEntries,
      onFlipCard: handleRevealInitialCard,
      onDrawCard: handleDrawCard,
      onReplaceCard: handleReplaceWithDrawnCard,
      onRevealCard: handleRevealAfterDiscard,
      localPlayerName,
      isSubmittingAction,
    });
  }

  return React.createElement(GameSetupView, {
    isLoading,
    roomId,
    roomIdInput,
    gameStarted: roomState.gameStarted,
    isJoiningRoom: isJoiningExistingRoom,
    hasCreatedRoom,
    isRoomSelectionLocked,
    isPlayerNameValid,
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
