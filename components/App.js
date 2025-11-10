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

  const activeRoomIdRef = useRef(roomId);
  const isFetchingRoomRef = useRef(false);

  useEffect(() => {
    activeRoomIdRef.current = roomId;
  }, [roomId]);

  const loadRoomState = useCallback(
    async (targetRoomId = roomId, { silent = false } = {}) => {
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
        });
        setPlayerNames(data.players ?? []);
        setErrorMessage("");

        const snapshot = data.snapshot ?? null;
        if (snapshot) {
          setGameStarted(true);
          setLogEntries(snapshot.logEntries ?? []);
          setActivePlayers(snapshot.players ?? []);
          setDeckView(
            snapshot.deck
              ? {
                  baseImage: "images/deck.png",
                  firstCard: snapshot.deck.topCard
                    ? {
                        image: snapshot.deck.topCard.image,
                        visible: snapshot.deck.topCard.visible,
                        alt: snapshot.deck.topCard.visible
                          ? `Top card ${snapshot.deck.topCard.value}`
                          : "Hidden top card",
                      }
                    : null,
                }
              : null
          );
        } else {
          setGameStarted(false);
          setLogEntries([]);
          setActivePlayers([]);
          setDeckView(null);
        }

        if (!silent) {
          setNewPlayerName("");
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

    loadRoomState(roomId, { silent: false });
  }, [roomId, loadRoomState, initialRoomBootstrapped]);

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
      setActivePlayers(players);
      setDeckView({
        baseImage: "images/deck.png",
        firstCard: deck.topCard
          ? {
              image: deck.topCard.image,
              visible: deck.topCard.visible,
              alt: deck.topCard.visible
                ? `Top card ${deck.topCard.value}`
                : "Hidden top card",
            }
          : null,
      });
      setGameStarted(true);
      setRoomState((prev) => ({
        ...prev,
        canAddPlayer: false,
        canStartGame: false,
      }));
      loadRoomState(roomId, { silent: true });
    } catch (error) {
      consoleLogger.error("Unable to start Skyjo game", error);
      setLogEntries([]);
      setErrorMessage(error instanceof Error ? error.message : String(error));
      setActivePlayers([]);
      setDeckView(null);
      setGameStarted(false);
    }
  };

  const handleAddPlayer = async () => {
    try {
      const { players: updatedNames } = await RoomApi.joinRoom(
        roomId,
        newPlayerName
      );
      setPlayerNames(updatedNames);
      setRoomState((prev) => ({
        ...prev,
        players: updatedNames,
        canAddPlayer: updatedNames.length < skyjo.maxPlayers,
        canStartGame: updatedNames.length >= skyjo.minPlayers,
      }));
      setNewPlayerName("");
      setErrorMessage("");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : String(error));
    }
  };

  const handleNewPlayerNameChange = (value) => {
    setNewPlayerName(value);
  };

  const handleRoomIdInputChange = (value) => {
    setRoomIdInput(value.toUpperCase());
  };

  const handleApplyRoomId = () => {
    const normalized = roomIdInput.trim().toUpperCase();
    setRoomIdInput(normalized);
    if (!normalized) {
      setErrorMessage("Room ID must not be empty.");
      return;
    }

    if (normalized === roomId) {
      setErrorMessage("");
      return;
    }

    setErrorMessage("");
    setRoomId(normalized);
  };

  const handleCreateRoom = async () => {
    setIsLoading(true);
    try {
      const { roomId: createdId = generateRoomId() } =
        await RoomApi.createRoom();
      setErrorMessage("");
      setRoomId(createdId);
      setRoomIdInput(createdId);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setIsLoading(false);
    }
  };

  if (gameStarted) {
    return React.createElement(GamePlayView, {
      activePlayers,
      logEntries,
      deck: deckView,
    });
  }

  return React.createElement(GameSetupView, {
    isLoading,
    roomId,
    roomIdInput,
    onRoomIdInputChange: handleRoomIdInputChange,
    onApplyRoomId: handleApplyRoomId,
    onCreateRoom: handleCreateRoom,
    playerNames,
    playerColors,
    newPlayerName,
    onNewPlayerNameChange: handleNewPlayerNameChange,
    onAddPlayer: handleAddPlayer,
    onStartGame: handleStartGame,
    canStartGame: roomState.canStartGame,
    canAddPlayer: roomState.canAddPlayer,
    errorMessage,
  });
}
