import React from "https://esm.sh/react@18?dev";

export function GamePlayView({ activePlayers, logEntries, deck }) {
  const layouts = {
    0: {
      columns: 3,
      rows: 1,
      deck: { rowStart: 1, rowEnd: 2, colStart: 2, colEnd: 3 },
      seats: [],
    },
    1: {
      columns: 3,
      rows: 1,
      deck: { rowStart: 1, rowEnd: 2, colStart: 2, colEnd: 3 },
      seats: [{ row: 1, col: 1 }],
    },
    2: {
      columns: 3,
      rows: 1,
      deck: { rowStart: 1, rowEnd: 2, colStart: 2, colEnd: 3 },
      seats: [
        { row: 1, col: 1 },
        { row: 1, col: 3 },
      ],
    },
    3: {
      columns: 3,
      rows: 2,
      deck: { rowStart: 1, rowEnd: 2, colStart: 2, colEnd: 3 },
      seats: [
        { row: 1, col: 1 },
        { row: 1, col: 3 },
        { row: 2, col: 2 },
      ],
    },
    4: {
      columns: 3,
      rows: 3,
      deck: { rowStart: 2, rowEnd: 3, colStart: 2, colEnd: 3 },
      seats: [
        { row: 2, col: 1 },
        { row: 1, col: 2 },
        { row: 2, col: 3 },
        { row: 3, col: 2 },
      ],
    },
    5: {
      columns: 4,
      rows: 3,
      deck: { rowStart: 2, rowEnd: 3, colStart: 2, colEnd: 4 },
      seats: [
        { row: 2, col: 1 },
        { row: 1, col: 2 },
        { row: 1, col: 3 },
        { row: 2, col: 4 },
        { row: 3, col: 2 },
      ],
    },
    6: {
      columns: 4,
      rows: 3,
      deck: { rowStart: 2, rowEnd: 3, colStart: 2, colEnd: 4 },
      seats: [
        { row: 2, col: 1 },
        { row: 1, col: 2 },
        { row: 1, col: 3 },
        { row: 2, col: 4 },
        { row: 3, col: 2 },
        { row: 3, col: 3 },
      ],
    },
    7: {
      columns: 4,
      rows: 4,
      deck: { rowStart: 2, rowEnd: 4, colStart: 2, colEnd: 4 },
      seats: [
        { row: 2, col: 1 },
        { row: 1, col: 2 },
        { row: 1, col: 3 },
        { row: 2, col: 4 },
        { row: 4, col: 2 },
        { row: 4, col: 3 },
        { row: 3, col: 1 },
      ],
    },
    8: {
      columns: 4,
      rows: 4,
      deck: { rowStart: 2, rowEnd: 4, colStart: 2, colEnd: 4 },
      seats: [
        { row: 2, col: 1 },
        { row: 1, col: 2 },
        { row: 1, col: 3 },
        { row: 2, col: 4 },
        { row: 4, col: 2 },
        { row: 4, col: 3 },
        { row: 3, col: 1 },
        { row: 3, col: 4 },
      ],
    },
  };

  const playerCount = activePlayers.length;
  const layout = layouts[playerCount] ?? layouts[Math.min(playerCount, 8)];

  const gridItems = [];

  if (deck) {
    gridItems.push({
      type: "deck",
      key: "deck",
      rowStart: layout.deck.rowStart,
      rowEnd: layout.deck.rowEnd,
      colStart: layout.deck.colStart,
      colEnd: layout.deck.colEnd,
    });
  }

  activePlayers.forEach((player, index) => {
    const seat = layout.seats[index] ?? layout.seats[layout.seats.length - 1];
    gridItems.push({
      type: "player",
      key: `player-${player.name}`,
      player,
      rowStart: seat.row,
      rowEnd: seat.row + 1,
      colStart: seat.col,
      colEnd: seat.col + 1,
    });
  });

  const maxRow =
    gridItems.reduce(
      (largest, item) => Math.max(largest, item.rowEnd - 1),
      1
    ) || 1;

  const gridListStyle = {
    display: "grid",
    gridTemplateColumns: `repeat(${layout.columns}, minmax(0, 1fr))`,
    gridTemplateRows: `repeat(${Math.max(maxRow, layout.rows)}, auto)`,
    gap: "0.75rem",
    justifyItems: "stretch",
    alignItems: "center",
    justifyContent: "center",
  };

  const playerEntries = gridItems.map((item) => {
    const baseStyle = {
      gridColumn: `${item.colStart} / ${item.colEnd}`,
      gridRow: `${item.rowStart} / ${item.rowEnd}`,
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
