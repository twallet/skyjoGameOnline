import React from "https://esm.sh/react@18?dev";

export function GamePlayView({ activePlayers, logEntries }) {
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
