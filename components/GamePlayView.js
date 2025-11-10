import React from "https://esm.sh/react@18?dev";

export function GamePlayView({ activePlayers, logEntries, deck }) {
  const seatCoordinates = {
    "top-left": { row: 1, col: 1 },
    "top-center": { row: 1, col: 2 },
    "top-right": { row: 1, col: 3 },
    "middle-left": { row: 2, col: 1 },
    "middle-right": { row: 2, col: 3 },
    "bottom-left": { row: 3, col: 1 },
    "bottom-center": { row: 3, col: 2 },
    "bottom-right": { row: 3, col: 3 },
    "extra-bottom-left": { row: 4, col: 1 },
    "extra-bottom-center": { row: 4, col: 2 },
    "extra-bottom-right": { row: 4, col: 3 },
  };

  const layoutsByCount = {
    0: [],
    1: ["middle-left"],
    2: ["middle-left", "middle-right"],
    3: ["top-center", "bottom-left", "bottom-right"],
    4: ["top-center", "bottom-left", "bottom-right", "extra-bottom-center"],
    5: [
      "top-left",
      "bottom-left",
      "bottom-right",
      "extra-bottom-center",
      "top-right",
    ],
    6: [
      "top-left",
      "bottom-left",
      "bottom-right",
      "extra-bottom-center",
      "top-right",
      "top-center",
    ],
    7: [
      "top-left",
      "bottom-left",
      "bottom-right",
      "extra-bottom-center",
      "top-right",
      "top-center",
      "middle-left",
    ],
    8: [
      "top-left",
      "bottom-left",
      "bottom-right",
      "extra-bottom-center",
      "top-right",
      "top-center",
      "middle-left",
      "middle-right",
    ],
  };

  const deckPositionByCount = {
    0: { row: 2, col: 2 },
    1: { row: 2, col: 2 },
    2: { row: 2, col: 2 },
    3: { row: 3, col: 2 },
    4: { row: 3, col: 2 },
    5: { row: 3, col: 2 },
    6: { row: 3, col: 2 },
    7: { row: 3, col: 2 },
    8: { row: 3, col: 2 },
  };

  const playerCount = activePlayers.length;
  const playerLayout =
    layoutsByCount[playerCount] ?? layoutsByCount[Math.min(playerCount, 8)];
  const fallbackSeat = "extra-bottom-right";

  const gridItems = [];

  if (deck) {
    const deckPosition =
      deckPositionByCount[playerCount] ?? deckPositionByCount[8];
    gridItems.push({
      type: "deck",
      key: "deck",
      row: deckPosition.row,
      col: deckPosition.col,
    });
  }

  activePlayers.forEach((player, index) => {
    const seatKey = playerLayout[index] ?? fallbackSeat;
    const seat = seatCoordinates[seatKey] ?? seatCoordinates["bottom-center"];
    gridItems.push({
      type: "player",
      key: `player-${player.name}`,
      player,
      row: seat.row,
      col: seat.col,
    });
  });

  const maxRow =
    gridItems.reduce((largest, item) => Math.max(largest, item.row), 1) || 1;

  const gridListStyle = {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gridTemplateRows: `repeat(${maxRow}, auto)`,
    gap: "0.75rem",
    justifyItems: "stretch",
    alignItems: "center",
    justifyContent: "center",
  };

  const playerEntries = gridItems.map((item) => {
    const baseStyle = {
      gridColumn: `${item.col}`,
      gridRow: `${item.row}`,
      justifySelf: "stretch",
    };

    if (item.type === "deck") {
      return React.createElement(
        "li",
        {
          key: item.key,
          className: "player-entry player-entry--active deck-entry",
          style: { ...baseStyle, backgroundColor: "transparent" },
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
      );
    }

    return React.createElement(
      "li",
      {
        key: item.key,
        className: "player-entry player-entry--active",
        style: {
          ...baseStyle,
          backgroundColor: item.player.color ?? "rgba(255,255,255,0.85)",
        },
      },
      React.createElement(
        "span",
        { className: "player-entry__name" },
        item.player.name
      ),
      React.createElement(
        "div",
        { className: "player-entry__hand" },

        item.player.hand.cardsMatrix().map((row, rowIndex) =>
          React.createElement(
            "div",
            {
              key: `row-${rowIndex}`,
              className: "player-entry__hand-row",
              style: {
                gridTemplateColumns: `repeat(${row.length}, minmax(0, 1fr))`,
              },
            },
            row.map((cardData, cardIndex) =>
              React.createElement("img", {
                key: `card-${rowIndex}-${cardIndex}`,
                className: "player-entry__card",
                src: cardData.image,
                alt: `${item.player.name} card ${cardData.value}`,
              })
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
      React.createElement("ul", { style: gridListStyle }, playerEntries)
    ),
    React.createElement("section", { className: "log", hidden: true })
  );
}
