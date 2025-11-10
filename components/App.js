import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "https://esm.sh/react@18?dev";

import { Game } from "../model/game.js";
import { GameRoomService } from "../services/GameRoomService.js";
import { consoleLogger } from "../utils/logger.js";
import { generateRoomId } from "../utils/id.js";
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
  const [gameRoom, setGameRoom] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const [logEntries, setLogEntries] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [playerNames, setPlayerNames] = useState([]);
  const [newPlayerName, setNewPlayerName] = useState("");
  const [gameStarted, setGameStarted] = useState(false);
  const [activePlayers, setActivePlayers] = useState([]);
  const [deckView, setDeckView] = useState(null);

  useEffect(() => {
    if (!roomId) {
      return;
    }

    let cancelled = false;

    async function loadRoomState() {
      setIsLoading(true);
      try {
        const response = await fetch(`/rooms/${roomId}`);
        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          throw new Error(payload.error ?? "Unable to load room state.");
        }
        const data = await response.json();
        if (!cancelled) {
          setRoomState(data);
          setPlayerNames(data.players ?? []);
          setLogEntries([]);
          setActivePlayers([]);
          setDeckView(null);
          setGameStarted(false);
          setNewPlayerName("");
          const resolvedRoom = GameRoomService.getOrCreate(
            data.roomId ?? roomId,
            skyjo,
            playerColors,
            consoleLogger
          );
          setGameRoom(resolvedRoom);
          setErrorMessage("");
        }
      } catch (error) {
        if (!cancelled) {
          consoleLogger.error("Failed to load room state", error);
          setErrorMessage(
            error instanceof Error ? error.message : String(error)
          );
          setRoomState({
            players: [],
            canAddPlayer: true,
            canStartGame: false,
          });
          setPlayerNames([]);
          setGameRoom(null);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadRoomState();

    return () => {
      cancelled = true;
    };
  }, [roomId, playerColors]);

  useEffect(() => {
    return () => {
      if (gameRoom) {
        gameRoom.resetRoom();
        GameRoomService.remove(roomId);
      }
    };
  }, [gameRoom, roomId]);

  const handleStartGame = async () => {
    try {
      const response = await fetch(`/rooms/${roomId}/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error ?? "Unable to start Skyjo game.");
      }
      const { players, logEntries: entries, deck } = await response.json();

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
      const response = await fetch(`/rooms/${roomId}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newPlayerName }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error ?? "Unable to join room.");
      }
      const { players: updatedNames } = await response.json();
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
    if (gameRoom) {
      gameRoom.resetRoom();
      GameRoomService.remove(roomId);
    }
    setRoomId(normalized);
  };

  const handleCreateRoom = () => {
    const newId = generateRoomId();
    setErrorMessage("");
    if (gameRoom) {
      gameRoom.resetRoom();
      GameRoomService.remove(roomId);
    }
    setRoomId(newId);
    setRoomIdInput(newId);
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
