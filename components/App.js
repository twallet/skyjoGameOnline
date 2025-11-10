import React, { useMemo, useState } from "https://esm.sh/react@18?dev";

import { Dealer } from "../model/dealer.js";
import { Game } from "../model/game.js";
import { Player } from "../model/player.js";
import { GamePlayView } from "./GamePlayView.js";
import { GameSetupView } from "./GameSetupView.js";

const skyjo = new Game(
  "Skyjo",
  [-2, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
  [5, 10, 15, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10],
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

  const playerColors = useMemo(
    () =>
      Array.from({ length: skyjo.maxPlayers }, (_, index) => {
        const hue = Math.round((index * 360) / skyjo.maxPlayers);
        return `hsl(${hue}, 70%, 85%)`;
      }),
    []
  );

  const handleStartGame = () => {
    if (playerNames.length < skyjo.minPlayers) {
      setLogEntries([]);
      setErrorMessage(
        `Add at least ${skyjo.minPlayers} players before starting the game.`
      );
      return;
    }

    setErrorMessage("");

    try {
      const players = playerNames.map(
        (name, index) =>
          new Player(name, skyjo, playerColors[index % playerColors.length])
      );
      const dealer = new Dealer(skyjo, players);

      dealer.shuffle();
      dealer.deal();

      const entries = players.map(
        (player) => `${player.name}: ${player.hand.show()}`
      );

      setLogEntries([
        `Game: ${skyjo.name}`,
        `Players: ${players.map((player) => player.name).join(", ")}`,
        ...entries,
        `${dealer.deck.size()} cards in deck.`,
      ]);
      setActivePlayers(players);
      setGameStarted(true);
    } catch (error) {
      console.error("Unable to start Skyjo game", error);
      setLogEntries([]);
      setErrorMessage(error instanceof Error ? error.message : String(error));
      setActivePlayers([]);
      setGameStarted(false);
    }
  };

  const handleAddPlayer = () => {
    const trimmedName = newPlayerName.trim();

    if (playerNames.length >= skyjo.maxPlayers) {
      setErrorMessage(
        `You cannot add more than ${skyjo.maxPlayers} players to the game.`
      );
      return;
    }

    if (!trimmedName) {
      setErrorMessage("Player name must not be empty.");
      return;
    }

    if (playerNames.includes(trimmedName)) {
      setErrorMessage("Player name must be unique.");
      return;
    }

    setPlayerNames([...playerNames, trimmedName]);
    setNewPlayerName("");
    setErrorMessage("");
  };

  const handleNewPlayerNameChange = (value) => {
    setNewPlayerName(value);
  };

  if (gameStarted) {
    return React.createElement(GamePlayView, {
      activePlayers,
      logEntries,
    });
  }

  return React.createElement(GameSetupView, {
    playerNames,
    playerColors,
    newPlayerName,
    onNewPlayerNameChange: handleNewPlayerNameChange,
    onAddPlayer: handleAddPlayer,
    onStartGame: handleStartGame,
    canStartGame: playerNames.length >= skyjo.minPlayers,
    canAddPlayer: playerNames.length < skyjo.maxPlayers,
    errorMessage,
  });
}
