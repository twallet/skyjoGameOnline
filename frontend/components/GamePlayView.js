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
  const gridRef = React.useRef(null);
  const [cardSizeStyle, setCardSizeStyle] = useState({});

  useEffect(() => {
    const updateCardSize = () => {
      if (!gridRef.current) {
        return;
      }

      const bounding = gridRef.current.getBoundingClientRect();
      const playerCount = players.length;

      const columnsNeeded = playerCount <= 4 ? 2 : 3;
      const rowsNeeded = Math.ceil(playerCount / columnsNeeded);

      const cardWidthByColumns =
        bounding.width / Math.max(columnsNeeded * 4, 4) - 12;
      const cardHeightByRows =
        bounding.height / Math.max(rowsNeeded * 5, 5) - 12;
      const computedWidth = Math.max(
        48,
        Math.min(cardWidthByColumns, (cardHeightByRows * 7) / 10, 90)
      );
      const computedHeight = (computedWidth * 10) / 7;

      setCardSizeStyle({
        "--card-width": `${computedWidth}px`,
        "--card-height": `${computedHeight}px`,
      });
    };

    updateCardSize();
    const resizeObserver = new ResizeObserver(updateCardSize);
    if (gridRef.current) {
      resizeObserver.observe(gridRef.current);
    }
    window.addEventListener("resize", updateCardSize);

    return () => {
      window.removeEventListener("resize", updateCardSize);
      if (gridRef.current) {
        resizeObserver.unobserve(gridRef.current);
      }
    };
  }, [players.length]);

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
  const [isDraggingDrawnCard, setIsDraggingDrawnCard] = useState(false);
  const [pendingDiscardReveal, setPendingDiscardReveal] = useState(false);
  const canDropOnDiscard = drawnBelongsToLocal;
  const canResolveDrawnCard =
    drawnBelongsToLocal && !isSubmittingAction && Boolean(drawnCard);

  const handleDrawnCardDragStart = (event) => {
    if (!drawnBelongsToLocal) {
      event.preventDefault();
      return;
    }
    setIsDraggingDrawnCard(true);
    setMainActionMode("replace");
    setPendingDiscardReveal(false);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", "drawn-card");
  };

  const handleDrawnCardDragEnd = () => {
    setIsDraggingDrawnCard(false);
  };

  useEffect(() => {
    if (!drawnBelongsToLocal) {
      setMainActionMode("replace");
      setIsDraggingDrawnCard(false);
      setPendingDiscardReveal(false);
    }
  }, [drawnBelongsToLocal, drawnCard?.playerName, drawnCard?.value]);

  let instruction = null;
  if (phase === "initial-flip") {
    instruction = "Flip two of your cards";
  } else if (phase === "main-play") {
    if (drawnBelongsToLocal) {
      instruction = pendingDiscardReveal
        ? "Drag completed. Choose one of your hidden cards to reveal."
        : "Drag the drawn card onto a hand position to replace it, or onto the discard pile.";
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

  const gridListStyle = {
    display: "grid",
    gridTemplateColumns: `repeat(${layout.columns}, minmax(0, 1fr))`,
    gridAutoRows: "auto",
    gap: "0.75rem",
    justifyItems: "stretch",
    alignItems: "center",
    justifyContent: "center",
  };

  const playerEntries = [];

  if (deck) {
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

    const handleDiscardDragOver = (event) => {
      if (!drawnBelongsToLocal) {
        return;
      }
      event.preventDefault();
      event.dataTransfer.dropEffect = "move";
    };

    const handleDiscardDrop = (event) => {
      if (!drawnBelongsToLocal) {
        return;
      }
      event.preventDefault();
      setMainActionMode("reveal");
      setPendingDiscardReveal(true);
      setIsDraggingDrawnCard(false);
    };

    const deckTitle = canDrawFromDeck
      ? "Draw a card from the deck"
      : "Deck of cards";
    const discardTitle = canDropOnDiscard
      ? "Drop here to discard"
      : canDrawFromDiscard
        ? "Take the top discard card"
        : (deck?.firstCard?.alt ?? "Visible top card");

    const baseImageClasses = ["deck-entry__image", "deck-entry__image--base"];
    if (canDrawFromDeck) {
      baseImageClasses.push("deck-entry__image--interactive");
    }

    const topCardClasses = ["deck-entry__image", "deck-entry__image--top-card"];
    if (canDrawFromDiscard || canDropOnDiscard) {
      topCardClasses.push("deck-entry__image--interactive");
    }

    const allowDiscardDrop = canDropOnDiscard;

    playerEntries.push(
      React.createElement(
        "div",
        {
          key: "deck-wrapper",
          className: "deck-entry-wrapper",
          style: {
            gridColumn: `${layout.deck.colStart} / ${layout.deck.colEnd}`,
            gridRow: `${layout.deck.rowStart} / ${layout.deck.rowEnd}`,
          },
        },
        React.createElement(
          "div",
          {
            className: `player-entry deck-entry${
              isDraggingDrawnCard && allowDiscardDrop
                ? " deck-entry--drop-active"
                : ""
            }`,
          },
          React.createElement(
            "div",
            { className: "deck-entry__images" },
            React.createElement("img", {
              className: baseImageClasses.join(" "),
              src: deck.backImage ?? deck.baseImage,
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
                  onClick: canDrawFromDiscard
                    ? handleDrawFromDiscard
                    : undefined,
                  onDragOver: allowDiscardDrop
                    ? handleDiscardDragOver
                    : undefined,
                  onDrop: allowDiscardDrop ? handleDiscardDrop : undefined,
                })
              : allowDiscardDrop
                ? React.createElement("div", {
                    className: "deck-entry__drop-zone",
                    title: discardTitle,
                    onDragOver: handleDiscardDragOver,
                    onDrop: handleDiscardDrop,
                  })
                : null
          ),
          instruction
            ? React.createElement(
                "p",
                { className: "deck-entry__instruction" },
                instruction
              )
            : null
        )
      )
    );
  }

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
    const isDrawnCardOwner =
      Boolean(drawnCard?.playerName) &&
      normalizedPlayerName.length > 0 &&
      drawnCard.playerName.localeCompare(normalizedPlayerName, undefined, {
        sensitivity: "accent",
      }) === 0;

    const handMatrix = Array.isArray(player.handMatrix)
      ? player.handMatrix
      : [];
    const rowOffsets = [];
    handMatrix.reduce((offset, row, rowIndex) => {
      rowOffsets[rowIndex] = offset;
      return offset + row.length;
    }, 0);

    playerEntries.push(
      React.createElement(
        "div",
        {
          key: `player-${player.name}`,
          className: "player-entry player-entry--active",
          style: {
            gridColumn: `${seat.col} / ${seat.col + 1}`,
            gridRow: `${seat.row} / ${seat.row + 1}`,
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
                const alreadyFlipped = flippedPositions.has(position);
                const canFlip =
                  phase === "initial-flip" &&
                  isLocalPlayer &&
                  typeof onFlipCard === "function" &&
                  requiredInitialReveals > flippedPositions.size &&
                  isHidden &&
                  !alreadyFlipped &&
                  !isSubmittingAction;

                const allowReplace =
                  isLocalPlayer &&
                  canResolveDrawnCard &&
                  mainActionMode === "replace" &&
                  typeof onReplaceCard === "function";
                const allowReveal =
                  isLocalPlayer &&
                  canResolveDrawnCard &&
                  mainActionMode === "reveal" &&
                  typeof onRevealCard === "function" &&
                  isHidden;
                const allowDropReplace =
                  allowReplace && drawnBelongsToLocal && isDraggingDrawnCard;

                let onCardClick = null;
                let cardTitle = `${player.name} card ${cardValue}`;

                if (canFlip) {
                  onCardClick = () => {
                    onFlipCard(player.name, position);
                  };
                  cardTitle = "Flip this card";
                } else if (allowReplace) {
                  onCardClick = () => {
                    setPendingDiscardReveal(false);
                    onReplaceCard(player.name, position);
                  };
                  cardTitle = "Replace this card with the drawn card";
                } else if (allowReveal) {
                  onCardClick = () => {
                    setPendingDiscardReveal(false);
                    onRevealCard(player.name, position);
                  };
                  cardTitle = "Reveal this hidden card after discarding";
                }

                const cardClasses = ["player-entry__card"];
                if (allowDropReplace) {
                  cardClasses.push("player-entry__card--drop-target");
                }
                if (onCardClick) {
                  cardClasses.push("player-entry__card--interactive");
                } else {
                  cardClasses.push("player-entry__card--inactive");
                }

                const handleCardDrop = (event) => {
                  if (!allowDropReplace) {
                    return;
                  }
                  event.preventDefault();
                  setIsDraggingDrawnCard(false);
                  setPendingDiscardReveal(false);
                  onReplaceCard(player.name, position);
                };

                const handleCardDragOver = (event) => {
                  if (!allowDropReplace) {
                    return;
                  }
                  event.preventDefault();
                  event.dataTransfer.dropEffect = "move";
                };

                return React.createElement("img", {
                  key: `card-${rowIndex}-${cardIndex}`,
                  className: cardClasses.join(" "),
                  src: cardData.image,
                  alt: `${player.name} card ${cardValue}`,
                  title: cardTitle,
                  onClick: onCardClick ?? undefined,
                  draggable: false,
                  onDragOver: allowDropReplace ? handleCardDragOver : undefined,
                  onDrop: allowDropReplace ? handleCardDrop : undefined,
                });
              })
            )
          )
        ),
        isDrawnCardOwner && drawnCard
          ? React.createElement(
              "div",
              {
                className: `player-entry__drawn-card${
                  isDraggingDrawnCard && drawnBelongsToLocal
                    ? " player-entry__drawn-card--dragging"
                    : ""
                }`,
              },
              React.createElement(
                "div",
                { className: "drawn-card__content" },
                React.createElement("img", {
                  className: `drawn-card__image${
                    isDraggingDrawnCard && drawnBelongsToLocal
                      ? " drawn-card__image--dragging"
                      : ""
                  }`,
                  src: drawnCard?.image,
                  alt: `Drawn card ${drawnCard?.value}`,
                  draggable: drawnBelongsToLocal,
                  onDragStart: drawnBelongsToLocal
                    ? handleDrawnCardDragStart
                    : undefined,
                  onDragEnd: drawnBelongsToLocal
                    ? handleDrawnCardDragEnd
                    : undefined,
                  style: drawnBelongsToLocal
                    ? undefined
                    : { cursor: "default" },
                }),
                drawnBelongsToLocal
                  ? React.createElement(
                      "span",
                      { className: "drawn-card__helper" },
                      pendingDiscardReveal
                        ? "Select a hidden card to reveal."
                        : "Drag to replace a card or drop on the discard pile."
                    )
                  : null
              )
            )
          : null
      )
    );
  });

  const actionControls =
    canResolveDrawnCard &&
    (typeof onReplaceCard === "function" || typeof onRevealCard === "function")
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
            typeof onReplaceCard === "function"
              ? React.createElement(
                  "button",
                  {
                    key: "replace",
                    type: "button",
                    onClick: () => {
                      setMainActionMode("replace");
                      setPendingDiscardReveal(false);
                    },
                    disabled: isSubmittingAction,
                    style:
                      mainActionMode === "replace"
                        ? { fontWeight: "bold" }
                        : undefined,
                  },
                  "Replace a card"
                )
              : null,
            typeof onRevealCard === "function"
              ? React.createElement(
                  "button",
                  {
                    key: "reveal",
                    type: "button",
                    onClick: () => {
                      setMainActionMode("reveal");
                      setPendingDiscardReveal(true);
                    },
                    disabled: isSubmittingAction,
                    style:
                      mainActionMode === "reveal"
                        ? { fontWeight: "bold" }
                        : undefined,
                  },
                  "Discard drawn card"
                )
              : null,
          ].filter(Boolean)
        )
      : null;

  return React.createElement(
    "main",
    { className: "app-container" },
    React.createElement(
      "section",
      { className: "players" },
      React.createElement("h2", null, "Skyjo"),
      React.createElement(
        "div",
        {
          className: "players-grid",
          style: { ...gridListStyle, ...cardSizeStyle },
          ref: gridRef,
        },
        playerEntries
      )
    ),
    actionControls
  );
}
