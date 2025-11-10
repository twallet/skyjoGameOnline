import React, { useMemo, useState } from "https://esm.sh/react@18?dev";

import { Game } from "../model/game.js";
import { GameSession } from "../model/gameSession.js";
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
  const [logEntries, setLogEntries] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [playerNames, setPlayerNames] = useState([]);
  const [newPlayerName, setNewPlayerName] = useState("");
  const [gameStarted, setGameStarted] = useState(false);
  const [activePlayers, setActivePlayers] = useState([]);
  const [deckView, setDeckView] = useState(null);
  const gameSession = useMemo(() => new GameSession(skyjo), []);

  const playerColors = useMemo(
    () =>
      Array.from({ length: skyjo.maxPlayers }, (_, index) => {
        const hue = Math.round((index * 360) / skyjo.maxPlayers);
        return `hsl(${hue}, 70%, 85%)`;
      }),
    []
  );

  const handleStartGame = () => {
    try {
      const {
        players,
        logEntries: entries,
        deck,
      } = gameSession.start(playerNames, playerColors);
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
      gameSession.reset();
      setLogEntries([]);
      setErrorMessage(error instanceof Error ? error.message : String(error));
      setActivePlayers([]);
      setDeckView(null);
      setGameStarted(false);
    }
  };

  const handleAddPlayer = () => {
    try {
      const updatedNames = gameSession.addPlayer(playerNames, newPlayerName);
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
    canStartGame: gameSession.canStartGame(playerNames.length),
    canAddPlayer: gameSession.canAddPlayer(playerNames.length),
    errorMessage,
  });
}
