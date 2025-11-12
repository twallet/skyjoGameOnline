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

  const maxHandColumns = React.useMemo(() => {
    if (!players.length) {
      return 4;
    }

    return players.reduce((maxCols, player) => {
      const handMatrix = Array.isArray(player.handMatrix)
        ? player.handMatrix
        : [];
      const longestRow = handMatrix.reduce(
        (longest, row) => Math.max(longest, row.length || 0),
        0
      );
      return Math.max(maxCols, Math.max(1, longestRow));
    }, 4);
  }, [players]);

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

  useEffect(() => {
    const CARD_GAP_PX = 12;
    const PLAYER_HORIZONTAL_PADDING = 32;
    const MAX_CARD_WIDTH = 110;
    const MIN_CARD_WIDTH = 40;

    const updateCardSize = () => {
      if (!gridRef.current) {
        return;
      }

      const bounding = gridRef.current.getBoundingClientRect();
      const computedGridStyle = window.getComputedStyle(gridRef.current);
      const columnGap = parseFloat(computedGridStyle.columnGap || "16");
      const rowGap = parseFloat(computedGridStyle.rowGap || "16");

      const playerCount = Math.max(players.length, 1);
      const gridColumns =
        layout.columns || Math.min(Math.max(playerCount, 1), 3);
      const gridRows = Math.ceil(playerCount / gridColumns);

      const availableWidthPerPlayer =
        (bounding.width - columnGap * Math.max(gridColumns - 1, 0)) /
        gridColumns;
      const availableHeightPerPlayer =
        (bounding.height - rowGap * Math.max(gridRows - 1, 0)) / gridRows;

      const innerWidth = Math.max(
        availableWidthPerPlayer - PLAYER_HORIZONTAL_PADDING,
        MIN_CARD_WIDTH * maxHandColumns
      );
      const cardWidthByColumns =
        (innerWidth - CARD_GAP_PX * Math.max(maxHandColumns - 1, 0)) /
        Math.max(maxHandColumns, 1);
      const cardHeightByRows =
        (availableHeightPerPlayer - PLAYER_HORIZONTAL_PADDING) / 3;

      const computedWidth = Math.max(
        MIN_CARD_WIDTH,
        Math.min(
          cardWidthByColumns,
          (cardHeightByRows * 7) / 10,
          MAX_CARD_WIDTH
        )
      );
      const computedHeight = (computedWidth * 10) / 7;
      const handWidth =
        maxHandColumns * computedWidth +
        Math.max(maxHandColumns - 1, 0) * CARD_GAP_PX;

      setCardSizeStyle({
        "--card-width": `${computedWidth}px`,
        "--card-height": `${computedHeight}px`,
        "--hand-columns": maxHandColumns,
        "--hand-width": `${handWidth}px`,
        "--card-gap": `${CARD_GAP_PX}px`,
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
  }, [players, layout.columns, maxHandColumns]);

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
          null
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

    const isCurrentTurn =
      typeof activeName === "string" &&
      activeName.localeCompare(normalizedPlayerName, undefined, {
        sensitivity: "accent",
      }) === 0;

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
          "div",
          { className: "player-entry__hand" },
          React.createElement(
            "div",
            {
              className: "player-entry__hand-row player-entry__hand-row--label",
            },
            React.createElement(
              "div",
              { className: "player-entry__hand-label" },
              isCurrentTurn
                ? React.createElement("img", {
                    className: "player-entry__indicator",
                    src: "./assets/images/here.gif",
                    alt: "Current turn indicator",
                  })
                : null,
              player.name
            ),
            isDrawnCardOwner && drawnCard
              ? React.createElement("img", {
                  className: "drawn-card__image drawn-card__image--inline",
                  src: drawnCard.image,
                  alt: `Drawn card ${drawnCard.value}`,
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
                })
              : null
          ),
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
        null
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
      React.createElement(
        "div",
        {
          className: "players-grid",
          style: { ...gridListStyle, ...cardSizeStyle },
          ref: gridRef,
        },
        playerEntries
      )
    )
  );
}
