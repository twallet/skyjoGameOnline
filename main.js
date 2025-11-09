import React, { useState } from "https://esm.sh/react@18?dev";
import { createRoot } from "https://esm.sh/react-dom@18/client?dev";

import { Game } from "./model/game.js";
import { Player } from "./model/player.js";
import { Dealer } from "./model/dealer.js";

const skyjo = new Game(
  "Skyjo",
  [-2, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
  [5, 10, 15, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10],
  12
);

const buildDefaultPlayers = () => [
  new Player("Alice"),
  new Player("Bob"),
  new Player("Charlie"),
];

function App() {
  const [logEntries, setLogEntries] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");

  const handleStartGame = () => {
    setErrorMessage("");

    try {
      const players = buildDefaultPlayers();
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

  return React.createElement(
    "main",
    { className: "app-container" },
    React.createElement("h1", null, "Skyjo"),
    React.createElement(
      "button",
      { type: "button", onClick: handleStartGame },
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
          React.createElement("h2", null, "Latest Deal"),
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
