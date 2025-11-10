import React from "https://esm.sh/react@18?dev";

export function GameSetupView({
  playerNames,
  playerColors,
  newPlayerName,
  onNewPlayerNameChange,
  onAddPlayer,
  onStartGame,
  canStartGame,
  canAddPlayer,
  errorMessage,
}) {
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
          onClick: onStartGame,
          disabled: !canStartGame,
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
      React.createElement("h2", null, "Players"),
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
                name
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
          onChange: (event) => onNewPlayerNameChange(event.target.value),
        }),
        React.createElement(
          "button",
          {
            type: "button",
            onClick: onAddPlayer,
            disabled: !canAddPlayer,
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
