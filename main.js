import React, { useState } from "https://esm.sh/react@18?dev";
import { createRoot } from "https://esm.sh/react-dom@18/client?dev";

import { Game } from "./model/game.js";
import { Player } from "./model/player.js";
import { Dealer } from "./model/dealer.js";

const skyjo = new Game(
  "Skyjo",
  [-2, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
  [5, 10, 15, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10],
  12,
  4
);

function App() {
  const [logEntries, setLogEntries] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [playerNames, setPlayerNames] = useState([]);
  const [newPlayerName, setNewPlayerName] = useState("");

  const handleStartGame = () => {
    if (playerNames.length < 2) {
      setLogEntries([]);
      setErrorMessage("Add at least two players before starting the game.");
      return;
    }

    setErrorMessage("");

    try {
      const players = playerNames.map((name) => new Player(name, skyjo));
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
        `Deck: ${dealer.deck.show()}`,
      ]);
    } catch (error) {
      console.error("Unable to start Skyjo game", error);
      setLogEntries([]);
      setErrorMessage(error instanceof Error ? error.message : String(error));
    }
  };

  const handleAddPlayer = () => {
    const trimmedName = newPlayerName.trim();

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

  return React.createElement(
    "main",
    { className: "app-container" },
    React.createElement("h1", null, "Skyjo"),
    React.createElement(
      "section",
      { className: "players" },
      React.createElement("h2", null, "Players"),
      React.createElement(
        "p",
        null,
        playerNames.length > 0
          ? `${playerNames.length} players: ${playerNames.join(", ")}`
          : "No players added yet."
      ),
      React.createElement(
        "div",
        { className: "new-player-controls" },
        React.createElement("input", {
          type: "text",
          placeholder: "Player name",
          value: newPlayerName,
          onChange: (event) => setNewPlayerName(event.target.value),
        }),
        React.createElement(
          "button",
          { type: "button", onClick: handleAddPlayer },
          "New player"
        )
      )
    ),
    React.createElement(
      "button",
      {
        type: "button",
        onClick: handleStartGame,
        disabled: playerNames.length < 2,
      },
      "Start game"
    ),
    errorMessage
      ? React.createElement(
          "p",
          { className: "error", role: "alert" },
          errorMessage
        )
      : null,
    logEntries.length > 0
      ? React.createElement(
          "section",
          { className: "log" },
          React.createElement("h2", null, "Game"),
          React.createElement(
            "ul",
            null,
            logEntries.map((entry, index) =>
              React.createElement("li", { key: index }, entry)
            )
          )
        )
      : null
  );
}

const container = document.getElementById("root");
const root = createRoot(container);

root.render(React.createElement(App));
