import React, {
  useEffect,
  useMemo,
  useState,
} from "https://esm.sh/react@18?dev";

import { Game } from "../model/game.js";
import { GameRoomService } from "../services/GameRoomService.js";
import { consoleLogger } from "../utils/logger.js";
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
  const gameRoom = useMemo(
    () =>
      GameRoomService.getOrCreate(
        "local-room",
        skyjo,
        playerColors,
        consoleLogger
      ),
    [playerColors]
  );

  const [logEntries, setLogEntries] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [playerNames, setPlayerNames] = useState(gameRoom.playerNames);
  const [newPlayerName, setNewPlayerName] = useState("");
  const [gameStarted, setGameStarted] = useState(false);
  const [activePlayers, setActivePlayers] = useState([]);
  const [deckView, setDeckView] = useState(null);
  useEffect(() => {
    return () => {
      gameRoom.resetRoom();
      GameRoomService.remove("local-room");
    };
  }, [gameRoom]);

  const handleStartGame = () => {
    try {
      const { players, logEntries: entries, deck } = gameRoom.startGame();
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
      console.error("Unable to start Skyjo game", error);
      gameRoom.resetRoom();
      setPlayerNames(gameRoom.playerNames);
      setLogEntries([]);
      setErrorMessage(error instanceof Error ? error.message : String(error));
      setActivePlayers([]);
      setDeckView(null);
      setGameStarted(false);
    }
  };

  const handleAddPlayer = () => {
    try {
      const updatedNames = gameRoom.addPlayer(newPlayerName);
      setPlayerNames(updatedNames);
      setNewPlayerName("");
      setErrorMessage("");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : String(error));
    }
  };

  const handleNewPlayerNameChange = (value) => {
    setNewPlayerName(value);
  };

  if (gameStarted) {
    return React.createElement(GamePlayView, {
      activePlayers,
      logEntries,
      deck: deckView,
    });
  }

  return React.createElement(GameSetupView, {
    playerNames,
    playerColors,
    newPlayerName,
    onNewPlayerNameChange: handleNewPlayerNameChange,
    onAddPlayer: handleAddPlayer,
    onStartGame: handleStartGame,
    canStartGame: gameRoom.canStartGame(),
    canAddPlayer: gameRoom.canAddPlayer(),
    errorMessage,
  });
}
