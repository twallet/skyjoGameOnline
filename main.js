import React, { useMemo, useState } from "https://esm.sh/react@18?dev";
import { createRoot } from "https://esm.sh/react-dom@18/client?dev";

import { Game } from "./model/game.js";
import { Player } from "./model/player.js";
import { Dealer } from "./model/dealer.js";

const skyjo = new Game(
  "Skyjo",
  [-2, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
  [5, 10, 15, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10],
  12,
  4,
  2,
  8
);

function App() {
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

  if (gameStarted) {
    return React.createElement(
      "main",
      { className: "app-container" },
      React.createElement(
        "section",
        { className: "players" },
        React.createElement("h2", null, "Players"),
        React.createElement(
          "ul",
          null,
          activePlayers.map((player) =>
            React.createElement(
              "li",
              {
                key: player.name,
                className: "player-entry player-entry--active",
                style: {
                  backgroundColor: player.color ?? "rgba(255,255,255,0.85)",
                },
              },
              React.createElement(
                "span",
                { className: "player-entry__name" },
                player.name
              ),
              React.createElement(
                "span",
                { className: "player-entry__hand" },
                player.hand.show()
              )
            )
          )
        )
      ),
      React.createElement(
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
    );
  }

  return React.createElement(
    "main",
    { className: "app-container" },
    React.createElement(
      "section",
      { className: "hero" },
      React.createElement("img", {
        src: "./images/skyjo_box.webp",
        alt: "Skyjo game box",
        className: "hero-image",
      }),
      React.createElement(
        "button",
        {
          type: "button",
          onClick: handleStartGame,
          disabled: playerNames.length < skyjo.minPlayers,
        },
        "Start"
      ),
      React.createElement("img", {
        src: "./images/deck.jpg",
        alt: "Deck of Skyjo cards",
        className: "hero-image",
      })
    ),
    React.createElement(
      "section",
      { className: "players" },
      React.createElement("h2", null, `Players`),
      playerNames.length > 0
        ? React.createElement(
            "ul",
            null,
            playerNames.map((name, index) =>
              React.createElement(
                "li",
                {
                  key: name,
                  className: "player-entry",
                  style: {
                    backgroundColor: playerColors[index % playerColors.length],
                  },
                },
                `${name}`
              )
            )
          )
        : React.createElement("p", null, "No players added yet."),
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
          {
            type: "button",
            onClick: handleAddPlayer,
            disabled: playerNames.length >= skyjo.maxPlayers,
          },
          "New player"
        )
      )
    ),
    errorMessage
      ? React.createElement(
          "p",
          { className: "error", role: "alert" },
          errorMessage
        )
      : null
  );
}

const container = document.getElementById("root");
const root = createRoot(container);

root.render(React.createElement(App));
