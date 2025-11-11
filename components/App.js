import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "https://esm.sh/react@18?dev";

import { Game } from "../model/game.js";
import { consoleLogger } from "../utils/logger.js";
import { generateRoomId } from "../utils/id.js";
import { RoomApi } from "../services/RoomApi.js";
import { GamePlayView } from "./GamePlayView.js";
import { GameSetupView } from "./GameSetupView.js";

const DECK_BASE_IMAGE = "images/deck.png";

function buildDeckView(deckSnapshot) {
  if (!deckSnapshot) {
    return null;
  }

  const topCard = deckSnapshot.topCard ?? null;
  return {
    size: deckSnapshot.size ?? 0,
    baseImage: DECK_BASE_IMAGE,
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

function normalizePlayerSnapshots(players) {
  if (!Array.isArray(players)) {
    return [];
  }

  return players.map((player) => ({
    name: player.name,
    color: player.color ?? null,
    handMatrix: Array.isArray(player.hand?.matrix) ? player.hand.matrix : [],
  }));
}

const skyjo = new Game(
  "Skyjo",
  [-2, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
  [5, 10, 15, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10],
  [
    "../images/minus2.jpg",
    "../images/minus1.jpg",
    "../images/0.jpg",
    "../images/1.jpg",
    "../images/2.jpg",
    "../images/3.jpg",
    "../images/4.jpg",
    "../images/5.jpg",
    "../images/6.jpg",
    "../images/7.jpg",
    "../images/8.jpg",
    "../images/9.jpg",
    "../images/10.jpg",
    "../images/11.jpg",
    "../images/12.jpg",
  ],
  "../images/back.jpg",
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
  const initialRoomIdRef = useRef(generateRoomId());
  const [roomId, setRoomId] = useState(initialRoomIdRef.current);
  const [roomIdInput, setRoomIdInput] = useState(initialRoomIdRef.current);
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
  const [initialRoomBootstrapped, setInitialRoomBootstrapped] = useState(false);
  const [isJoiningExistingRoom, setIsJoiningExistingRoom] = useState(false);
  const [hasCreatedRoom, setHasCreatedRoom] = useState(false);
  const [isRoomSelectionLocked, setIsRoomSelectionLocked] = useState(false);

  const loggedEventCountRef = useRef(0);
  const activeRoomIdRef = useRef(roomId);
  const isFetchingRoomRef = useRef(false);

  useEffect(() => {
    activeRoomIdRef.current = roomId;
  }, [roomId]);

  useEffect(() => {
    if (!Array.isArray(logEntries) || logEntries.length === 0) {
      loggedEventCountRef.current = 0;
      return;
    }

    const startIndex = Math.max(0, loggedEventCountRef.current);
    const newEntries = logEntries.slice(startIndex);

    newEntries.forEach((entry) => {
      consoleLogger.info(`Client event: ${entry}`);
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
          setGameStarted(true);
          setLogEntries(
            Array.isArray(snapshot.logEntries) ? snapshot.logEntries : []
          );
          setActivePlayers(normalizePlayerSnapshots(snapshot.players));
          setDeckView(buildDeckView(snapshot.deck));
        } else {
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
    let cancelled = false;

    async function bootstrapInitialRoom() {
      try {
        await RoomApi.createRoom(initialRoomIdRef.current);
        consoleLogger.info(
          `Client event: bootstrapped initial room '${initialRoomIdRef.current}'`
        );
      } catch (error) {
        consoleLogger.error("Unable to bootstrap initial room", error);
      } finally {
        if (!cancelled) {
          setInitialRoomBootstrapped(true);
        }
      }
    }

    bootstrapInitialRoom();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!roomId) {
      return;
    }

    if (
      roomId === initialRoomIdRef.current &&
      initialRoomBootstrapped === false
    ) {
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
    initialRoomBootstrapped,
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

  const handleStartGame = async () => {
    try {
      const {
        players,
        logEntries: entries,
        deck,
      } = await RoomApi.startGame(roomId);

      setErrorMessage("");
      setLogEntries(entries);
      setActivePlayers(normalizePlayerSnapshots(players));
      setDeckView(buildDeckView(deck));
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
      setLogEntries([]);
      setErrorMessage(error instanceof Error ? error.message : String(error));
      setActivePlayers([]);
      setDeckView(null);
      setGameStarted(false);
    }
  };

  const trimmedPlayerName = newPlayerName.trim();
  const playerNameLength = trimmedPlayerName.length;
  const isPlayerNameValid = playerNameLength > 0 && playerNameLength <= 20;

  const ensureValidPlayerName = () => {
    if (playerNameLength === 0) {
      setErrorMessage("Player name must not be empty.");
      return false;
    }
    if (playerNameLength > 20) {
      setErrorMessage("Player name must be 20 characters or fewer.");
      return false;
    }
    setErrorMessage("");
    return true;
  };

  useEffect(() => {
    if (!isPlayerNameValid && isJoiningExistingRoom) {
      setIsJoiningExistingRoom(false);
      setRoomIdInput((roomId ?? "").toUpperCase());
    }
    if (!isPlayerNameValid && hasCreatedRoom) {
      setHasCreatedRoom(false);
    }
    if (!isPlayerNameValid && isRoomSelectionLocked) {
      setIsRoomSelectionLocked(false);
    }
  }, [
    isPlayerNameValid,
    isJoiningExistingRoom,
    roomId,
    hasCreatedRoom,
    isRoomSelectionLocked,
  ]);

  const handleJoinRoom = async () => {
    if (!ensureValidPlayerName()) {
      return;
    }

    if (!isJoiningExistingRoom) {
      setIsJoiningExistingRoom(true);
      setIsRoomSelectionLocked(true);
      setErrorMessage("");
      setRoomIdInput("");
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
    const capped = value.slice(0, 20);
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
        await navigator.clipboard.writeText(roomId);
      } else {
        throw new Error("Clipboard not supported.");
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to copy room ID."
      );
    }
  };

  if (gameStarted) {
    return React.createElement(GamePlayView, {
      activePlayers,
      deck: deckView,
      roomId,
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
  });
}
