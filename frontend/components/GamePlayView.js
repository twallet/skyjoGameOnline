import React, { useEffect, useState } from "https://esm.sh/react@18?dev";

export function GamePlayView({
  activePlayers,
  deck,
  snapshot = null,
  gameState = null,
  sessionState = null,
  localPlayerName = "",
  onFlipCard = null,
  onDrawCard = null,
  onReplaceCard = null,
  onRevealCard = null,
  isSubmittingAction = false,
}) {
  const players = Array.isArray(activePlayers) ? activePlayers : [];

  const state =
    sessionState ?? gameState ?? (snapshot ? snapshot.state : null) ?? null;
  const phase = state?.phase ?? null;
  const initialFlipState = state?.initialFlip ?? null;
  const initialFlipPlayers = Array.isArray(initialFlipState?.players)
    ? initialFlipState.players
    : [];
  const requiredInitialReveals = initialFlipState?.requiredReveals ?? 0;
  const drawnCard = state?.drawnCard ?? null;
  const activeName = state?.activePlayer?.name ?? null;
  const normalizedLocalName =
    typeof localPlayerName === "string" ? localPlayerName.trim() : "";
  const normalizedActiveName =
    typeof activeName === "string" ? activeName.trim() : "";
  const isLocalActive =
    normalizedLocalName.length > 0 &&
    normalizedActiveName.length > 0 &&
    normalizedLocalName.localeCompare(normalizedActiveName, undefined, {
      sensitivity: "accent",
    }) === 0;
  const drawnBelongsToLocal =
    Boolean(drawnCard) &&
    typeof drawnCard.playerName === "string" &&
    normalizedLocalName.length > 0 &&
    drawnCard.playerName.localeCompare(normalizedLocalName, undefined, {
      sensitivity: "accent",
    }) === 0;
  const canControlDraws =
    isLocalActive &&
    !drawnCard &&
    typeof onDrawCard === "function" &&
    !isSubmittingAction;
  const canDrawFromDeck = canControlDraws;
  const canDrawFromDiscard =
    canControlDraws &&
    Boolean(deck?.firstCard) &&
    deck.firstCard.visible !== false;

  const [mainActionMode, setMainActionMode] = useState("replace");

  useEffect(() => {
    if (!drawnBelongsToLocal) {
      setMainActionMode("replace");
    }
  }, [drawnBelongsToLocal, drawnCard?.playerName, drawnCard?.value]);

  let instruction = null;
  if (phase === "initial-flip") {
    instruction = "Flip two of your cards";
  } else if (phase === "main-play") {
    if (drawnBelongsToLocal) {
      instruction =
        mainActionMode === "replace"
          ? "Select a card in your grid to replace with the drawn card."
          : "Choose one of your hidden cards to reveal after discarding.";
    } else if (drawnCard?.playerName) {
      instruction = `${drawnCard.playerName} is resolving a drawn card`;
    } else {
      instruction = activeName
        ? `It's ${activeName}'s turn`
        : "Main phase in progress";
    }
  } else if (phase === "final-round") {
    instruction = activeName
      ? `Final round: ${activeName}'s turn`
      : "Final round in progress";
  }

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

  const playerCount = players.length;
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

  const handleDrawFromDeck = () => {
    if (!normalizedLocalName || !canDrawFromDeck) {
      return;
    }
    onDrawCard?.(normalizedLocalName, "deck");
  };

  const handleDrawFromDiscard = () => {
    if (!normalizedLocalName || !canDrawFromDiscard) {
      return;
    }
    onDrawCard?.(normalizedLocalName, "discard");
  };

  const canReplaceCards =
    drawnBelongsToLocal &&
    mainActionMode === "replace" &&
    typeof onReplaceCard === "function" &&
    !isSubmittingAction;

  const canRevealCards =
    drawnBelongsToLocal &&
    mainActionMode === "reveal" &&
    typeof onRevealCard === "function" &&
    !isSubmittingAction;

  players.forEach((player, index) => {
    const seat = layout.seats[index] ?? layout.seats[layout.seats.length - 1];
    const initialFlipInfo = initialFlipPlayers.find(
      (entry) => entry?.name === player.name
    );
    const flippedPositions = new Set(
      Array.isArray(initialFlipInfo?.flippedPositions)
        ? initialFlipInfo.flippedPositions
        : []
    );
    const normalizedPlayerName =
      typeof player.name === "string" ? player.name.trim() : "";
    const isLocalPlayer =
      normalizedLocalName.length > 0 &&
      normalizedPlayerName.length > 0 &&
      normalizedLocalName.localeCompare(normalizedPlayerName, undefined, {
        sensitivity: "accent",
      }) === 0;
    gridItems.push({
      type: "player",
      key: `player-${player.name}`,
      player,
      isLocalPlayer,
      flippedPositions,
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
      const deckTitle = canDrawFromDeck
        ? "Draw a card from the deck"
        : "Deck of cards";
      const discardTitle = canDrawFromDiscard
        ? "Take the top discard card"
        : (deck?.firstCard?.alt ?? "Visible top card");
      const baseImageClasses = ["deck-entry__image", "deck-entry__image--base"];
      if (canDrawFromDeck) {
        baseImageClasses.push("deck-entry__image--interactive");
      }

      const topCardClasses = [
        "deck-entry__image",
        "deck-entry__image--top-card",
      ];
      if (canDrawFromDiscard) {
        topCardClasses.push("deck-entry__image--interactive");
      }

      return React.createElement(
        "li",
        {
          key: item.key,
          className: "player-entry deck-entry",
          style: {
            ...baseStyle,
            justifySelf: "center",
            alignSelf: "center",
            backgroundColor: "transparent",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          },
        },
        React.createElement(
          "div",
          { className: "deck-entry__images" },
          React.createElement("img", {
            className: baseImageClasses.join(" "),
            src: deck.baseImage,
            alt: "Deck of cards",
            title: deckTitle,
            onClick: canDrawFromDeck ? handleDrawFromDeck : undefined,
          }),
          deck.firstCard && deck.firstCard.visible !== false
            ? React.createElement("img", {
                className: topCardClasses.join(" "),
                src: deck.firstCard.image,
                alt: deck.firstCard.alt ?? "Visible top card",
                title: discardTitle,
                onClick: canDrawFromDiscard ? handleDrawFromDiscard : undefined,
              })
            : null
        )
      );
    }

    const handMatrix = Array.isArray(item.player.handMatrix)
      ? item.player.handMatrix
      : [];
    const rowOffsets = [];
    handMatrix.reduce((offset, row, rowIndex) => {
      rowOffsets[rowIndex] = offset;
      return offset + row.length;
    }, 0);

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
        handMatrix.map((row, rowIndex) =>
          React.createElement(
            "div",
            {
              key: `row-${rowIndex}`,
              className: "player-entry__hand-row",
              style: {
                gridTemplateColumns: `repeat(${row.length}, minmax(0, 1fr))`,
              },
            },
            row.map((cardData, cardIndex) => {
              const position = rowOffsets[rowIndex] + cardIndex;
              const cardValue = cardData.value;
              const isHidden = cardValue === "X";
              const alreadyFlipped = item.flippedPositions.has(position);
              const canFlip =
                phase === "initial-flip" &&
                item.isLocalPlayer &&
                typeof onFlipCard === "function" &&
                requiredInitialReveals > item.flippedPositions.size &&
                isHidden &&
                !alreadyFlipped &&
                !isSubmittingAction;

              const allowReplace = item.isLocalPlayer && canReplaceCards;
              const allowReveal =
                item.isLocalPlayer && canRevealCards && isHidden;

              let onCardClick = null;
              let cardTitle = `${item.player.name} card ${cardValue}`;

              if (canFlip) {
                onCardClick = () => {
                  onFlipCard(item.player.name, position);
                };
                cardTitle = "Flip this card";
              } else if (allowReplace) {
                onCardClick = () => {
                  onReplaceCard(item.player.name, position);
                };
                cardTitle = "Replace this card with the drawn card";
              } else if (allowReveal) {
                onCardClick = () => {
                  onRevealCard(item.player.name, position);
                };
                cardTitle = "Reveal this hidden card after discarding";
              }

              const cardClasses = ["player-entry__card"];
              if (onCardClick) {
                cardClasses.push("player-entry__card--interactive");
              } else {
                cardClasses.push("player-entry__card--inactive");
              }

              return React.createElement("img", {
                key: `card-${rowIndex}-${cardIndex}`,
                className: cardClasses.join(" "),
                src: cardData.image,
                alt: `${item.player.name} card ${cardValue}`,
                title: cardTitle,
                onClick: onCardClick ?? undefined,
                style: onCardClick ? { cursor: "pointer" } : undefined,
              });
            })
          )
        )
      )
    );
  });

  const actionControls =
    drawnBelongsToLocal && (canReplaceCards || canRevealCards)
      ? React.createElement(
          "div",
          {
            className: "gameplay__actions",
            style: {
              display: "flex",
              gap: "0.5rem",
              marginTop: "0.5rem",
            },
          },
          [
            React.createElement(
              "button",
              {
                key: "replace",
                type: "button",
                onClick: () => setMainActionMode("replace"),
                disabled: isSubmittingAction,
                style:
                  mainActionMode === "replace"
                    ? { fontWeight: "bold" }
                    : undefined,
              },
              "Replace a card"
            ),
            React.createElement(
              "button",
              {
                key: "reveal",
                type: "button",
                onClick: () => setMainActionMode("reveal"),
                disabled: isSubmittingAction,
                style:
                  mainActionMode === "reveal"
                    ? { fontWeight: "bold" }
                    : undefined,
              },
              "Discard drawn card"
            ),
          ]
        )
      : null;

  return React.createElement(
    "main",
    { className: "app-container" },
    React.createElement(
      "section",
      { className: "players" },
      React.createElement("h2", null, "Skyjo"),
      React.createElement("ul", { style: gridListStyle }, playerEntries)
    ),
    instruction
      ? React.createElement(
          "p",
          { className: "gameplay__instruction" },
          instruction
        )
      : null,
    actionControls
  );
}
