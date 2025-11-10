import React from "https://esm.sh/react@18?dev";

export function GamePlayView({ activePlayers, logEntries, deck }) {
  const playerEntries = [];

  if (deck) {
    playerEntries.push(
      React.createElement(
        "li",
        {
          key: "deck",
          className: "player-entry player-entry--active deck-entry",
          style: { backgroundColor: "transparent" },
        },
        React.createElement(
          "div",
          { className: "deck-entry__images" },
          React.createElement("img", {
            className: "deck-entry__image deck-entry__image--base",
            src: deck.baseImage,
            alt: "Deck of cards",
          }),
          deck.firstCard && deck.firstCard.visible
            ? React.createElement("img", {
                className: "deck-entry__image deck-entry__image--top-card",
                src: deck.firstCard.image,
                alt: deck.firstCard.alt ?? "Visible top card",
              })
            : null
        )
      )
    );
  }

  activePlayers.forEach((player) => {
    playerEntries.push(
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
          "div",
          { className: "player-entry__hand" },

          player.hand.cardsMatrix().map((row, rowIndex) =>
            React.createElement(
              "div",
              {
                key: `row-${rowIndex}`,
                className: "player-entry__hand-row",
              },
              row.map((cardData, cardIndex) =>
                React.createElement("img", {
                  key: `card-${rowIndex}-${cardIndex}`,
                  className: "player-entry__card",
                  src: cardData.image,
                  alt: `${player.name} card ${cardData.value}`,
                })
              )
            )
          )
        )
      )
    );
  });

  return React.createElement(
    "main",
    { className: "app-container" },
    React.createElement(
      "section",
      { className: "players" },
      React.createElement("h2", null, "Skyjo"),
      React.createElement("ul", null, playerEntries)
    ),
    React.createElement("section", { className: "log", hidden: true })
  );
}
