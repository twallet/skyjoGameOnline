import React, {
  useEffect,
  useMemo,
  useState,
} from "https://esm.sh/react@18?dev";

export function GamePlayView({
  activePlayers,
  deck,
  snapshot = null,
  gameState = null,
  sessionState = null,
  localPlayerName = "",
  logEntries = [],
  onFlipCard = null,
  onDrawCard = null,
  onReplaceCard = null,
  onRevealCard = null,
  isSubmittingAction = false,
}) {
  const players = Array.isArray(activePlayers) ? activePlayers : [];
  const gridRef = React.useRef(null);
  const [cardSizeStyle, setCardSizeStyle] = useState({});

  const buildPossessiveTurnLabel = React.useCallback((rawName) => {
    const trimmed =
      typeof rawName === "string" && rawName.trim().length > 0
        ? rawName.trim()
        : "";
    if (!trimmed) {
      return "Player Turn";
    }
    const suffix = /s$/i.test(trimmed) ? "'" : "'s";
    return `${trimmed}${suffix} Turn`;
  }, []);

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
  const drawnSource =
    typeof drawnCard?.source === "string" ? drawnCard.source.toLowerCase() : "";
  const drawnFromDiscard = drawnSource === "discard";
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
  const [pendingDiscardReveal, setPendingDiscardReveal] = useState(false);
  const [isLogExpanded, setIsLogExpanded] = useState(false);
  const canDropOnDiscard = drawnBelongsToLocal && !drawnFromDiscard;
  const canResolveDrawnCard =
    drawnBelongsToLocal && !isSubmittingAction && Boolean(drawnCard);
  const shouldShakeDiscard =
    drawnBelongsToLocal && mainActionMode === "replace" && canDropOnDiscard;
  const shouldShakeDrawSources =
    isLocalActive && !drawnCard && (canDrawFromDeck || canDrawFromDiscard);
  const [columnRemovalNotices, setColumnRemovalNotices] = useState([]);
  const displayedColumnRemovalIdsRef = React.useRef(new Set());

  const pendingColumnRemovalMap = React.useMemo(() => {
    const entries = Array.isArray(state?.pendingColumnRemovals)
      ? state.pendingColumnRemovals
      : [];
    const map = new Map();
    entries.forEach((entry) => {
      const playerName =
        typeof entry?.playerName === "string" ? entry.playerName : null;
      if (!playerName) {
        return;
      }
      const columns = Array.isArray(entry?.columns) ? entry.columns : [];
      const columnSet = new Set();
      columns.forEach((index) => {
        if (!Number.isInteger(index)) {
          return;
        }
        columnSet.add(index);
      });
      if (columnSet.size === 0) {
        return;
      }
      map.set(playerName, columnSet);
    });
    return map;
  }, [state?.pendingColumnRemovals]);

  useEffect(() => {
    const events = Array.isArray(state?.recentColumnRemovalEvents)
      ? state.recentColumnRemovalEvents
      : [];
    if (!events.length) {
      return;
    }
    const seenIds = displayedColumnRemovalIdsRef.current;
    const additions = events.filter(
      (event) => event && typeof event.id === "string" && !seenIds.has(event.id)
    );
    if (!additions.length) {
      return;
    }
    additions.forEach((event) => {
      seenIds.add(event.id);
    });
    setColumnRemovalNotices((previous) => {
      const mapped = additions.map((event) => {
        const timestamp =
          typeof event.timestamp === "number" ? event.timestamp : Date.now();
        const playerName =
          typeof event.playerName === "string" && event.playerName.trim().length
            ? event.playerName
            : Number.isInteger(event.playerIndex)
              ? `Player ${event.playerIndex + 1}`
              : "Unknown player";
        const columns = Array.isArray(event.columns) ? event.columns : [];
        return {
          id: event.id,
          playerName,
          columns,
          createdAt: timestamp,
          expiresAt: timestamp + 3000,
        };
      });
      return [...previous, ...mapped];
    });
  }, [state?.recentColumnRemovalEvents]);

  useEffect(() => {
    if (!columnRemovalNotices.length) {
      return undefined;
    }
    const intervalId = setInterval(() => {
      const now = Date.now();
      setColumnRemovalNotices((previous) =>
        previous.filter((entry) => entry.expiresAt > now)
      );
    }, 200);
    return () => {
      clearInterval(intervalId);
    };
  }, [columnRemovalNotices.length]);

  const eventEntries = useMemo(() => {
    const sourceEntries =
      Array.isArray(logEntries) && logEntries.length > 0
        ? logEntries
        : Array.isArray(snapshot?.logEntries)
          ? snapshot.logEntries
          : [];

    return sourceEntries.map((entry) => {
      if (entry && typeof entry === "object") {
        const rawMessage =
          typeof entry.message === "string"
            ? entry.message
            : String(entry.message ?? "");
        const message = /[.!?]$/.test(rawMessage)
          ? rawMessage
          : `${rawMessage}.`;
        const phase =
          typeof entry.phase === "string" && entry.phase.length
            ? entry.phase
            : null;
        const actor =
          typeof entry.actor === "string" && entry.actor.trim().length
            ? entry.actor.trim()
            : null;
        return { message, phase, actor };
      }
      const rawMessage =
        typeof entry === "string" ? entry : String(entry ?? "");
      const message = /[.!?]$/.test(rawMessage) ? rawMessage : `${rawMessage}.`;
      return { message, phase: null, actor: null };
    });
  }, [logEntries, snapshot?.logEntries]);

  const MAX_LOG_ENTRIES = 20;
  const visibleLogEntries = useMemo(() => {
    const trimmed = eventEntries.slice(-MAX_LOG_ENTRIES);
    return trimmed.reverse();
  }, [eventEntries]);
  const logEntryCount = eventEntries.length;

  const knownPlayerNames = useMemo(() => {
    const names = new Set();
    activePlayers.forEach((player) => {
      if (player?.name) {
        names.add(player.name);
      }
    });
    if (Array.isArray(snapshot?.players)) {
      snapshot.players.forEach((player) => {
        if (player?.name) {
          names.add(player.name);
        }
      });
    }
    eventEntries.forEach((entry) => {
      if (entry?.actor) {
        names.add(entry.actor);
      }
    });
    return Array.from(names).sort((a, b) => b.length - a.length);
  }, [activePlayers, snapshot?.players, eventEntries]);

  const pendingLocalColumns = useMemo(() => {
    if (!normalizedLocalName) {
      return null;
    }
    let match = null;
    pendingColumnRemovalMap.forEach((columns, playerName) => {
      if (match) {
        return;
      }
      if (
        typeof playerName === "string" &&
        playerName.localeCompare(normalizedLocalName, undefined, {
          sensitivity: "accent",
        }) === 0
      ) {
        match = columns;
      }
    });
    return match;
  }, [pendingColumnRemovalMap, normalizedLocalName]);

  const activePlayerDisplayName =
    typeof state?.activePlayer?.name === "string"
      ? state.activePlayer.name.trim()
      : "";

  const friendlyPhaseLabel = useMemo(() => {
    const phaseKey = state?.phase ?? null;
    if (!phaseKey) {
      return "Preparation";
    }
    switch (phaseKey) {
      case "initial-flip":
        return "Preparation";
      case "main-play": {
        if (activePlayerDisplayName.length > 0) {
          return buildPossessiveTurnLabel(activePlayerDisplayName);
        }
        return "Player Turn";
      }
      case "final-round":
        return "Final Round";
      case "finished":
        return "Finished";
      default:
        return "Preparation";
    }
  }, [state?.phase, activePlayerDisplayName, buildPossessiveTurnLabel]);

  const formattedLogEntries = useMemo(
    () =>
      visibleLogEntries.map((entry) =>
        typeof entry.message === "string"
          ? entry.message
          : String(entry.message ?? "")
      ),
    [visibleLogEntries]
  );

  const instructionMessage = useMemo(() => {
    if (isSubmittingAction) {
      return "Processing your action...";
    }
    if (!state) {
      return "Waiting for the latest game state...";
    }
    const currentPhase = state.phase ?? null;
    const finalRoundActive = Boolean(state?.finalRound?.inProgress);

    if (currentPhase === "initial-flip") {
      if (normalizedLocalName) {
        const localEntry = initialFlipPlayers.find((player) => {
          if (typeof player?.name !== "string") {
            return false;
          }
          return (
            player.name.localeCompare(normalizedLocalName, undefined, {
              sensitivity: "accent",
            }) === 0
          );
        });
        if (localEntry) {
          const reveals = Array.isArray(localEntry.flippedPositions)
            ? localEntry.flippedPositions.length
            : 0;
          const remaining = Math.max(requiredInitialReveals - reveals, 0);
          if (remaining > 0) {
            return `Reveal ${remaining} more card${
              remaining === 1 ? "" : "s"
            } to determine turn order.`;
          }
        }
      }
      const remainingPlayers = initialFlipPlayers.filter((player) => {
        const flips = Array.isArray(player?.flippedPositions)
          ? player.flippedPositions.length
          : 0;
        return flips < requiredInitialReveals;
      });
      if (remainingPlayers.length > 0) {
        const waitingNames = remainingPlayers
          .map((player) => player?.name)
          .filter((name) => typeof name === "string" && name.trim().length > 0);
        if (waitingNames.length > 0) {
          return `Waiting for ${waitingNames.join(", ")} to finish.`;
        }
      }
      return "Waiting for the turn order to be resolved.";
    }

    if (currentPhase === "main-play" || currentPhase === "final-round") {
      const isFinalRoundPhase =
        finalRoundActive || currentPhase === "final-round";
      if (isLocalActive) {
        if (drawnBelongsToLocal && Boolean(drawnCard)) {
          if (pendingDiscardReveal) {
            return "Choose a hidden card to reveal after discarding.";
          }
          const cardValue =
            drawnCard.value !== undefined && drawnCard.value !== null
              ? `${drawnCard.value}`
              : "a card";
          if (mainActionMode === "replace") {
            return `You drew ${cardValue}. Replace one of your cards.`;
          }
          return `You drew ${cardValue}. Select a hidden card to reveal.`;
        }
        if (!drawnCard) {
          if (canDrawFromDeck && canDrawFromDiscard) {
            return "Draw from the deck or take the discarded card.";
          }
          if (canDrawFromDeck) {
            return "Draw a card from the deck.";
          }
          if (canDrawFromDiscard) {
            return "Take the top discard card.";
          }
          return "Waiting for draw options to become available.";
        }
        return "Resolve the drawn card to continue.";
      }

      if (drawnBelongsToLocal && Boolean(drawnCard)) {
        if (pendingDiscardReveal) {
          return "Choose a hidden card to reveal after discarding.";
        }
        if (mainActionMode === "replace") {
          return "Replace one of your cards or discard.";
        }
        return "Select a hidden card to reveal.";
      }

      if (
        typeof state.activePlayer?.name === "string" &&
        state.activePlayer.name.trim().length > 0
      ) {
        return `Waiting for ${state.activePlayer.name} to play.`;
      }
      return isFinalRoundPhase
        ? "Waiting for the next player."
        : "Waiting for the next player.";
    }

    if (currentPhase === "finished") {
      return "Review the final scores.";
    }

    return "Waiting for the latest game state...";
  }, [
    isSubmittingAction,
    state,
    initialFlipPlayers,
    requiredInitialReveals,
    normalizedLocalName,
    isLocalActive,
    drawnBelongsToLocal,
    drawnCard,
    pendingDiscardReveal,
    canDrawFromDiscard,
    canDrawFromDeck,
    mainActionMode,
  ]);

  const instructionHints = useMemo(() => {
    if (isSubmittingAction) {
      return [];
    }
    const hints = [];
    if (pendingLocalColumns && pendingLocalColumns.size > 0) {
      const labels = Array.from(pendingLocalColumns)
        .map((index) => index + 1)
        .join(", ");
      hints.push(`Column ${labels} will be cleared.`);
    }
    if (state?.finalRound?.inProgress) {
      const trigger = state.finalRound.triggeredBy;
      if (typeof trigger === "string" && trigger.trim().length > 0) {
        if (
          normalizedLocalName &&
          trigger.localeCompare(normalizedLocalName, undefined, {
            sensitivity: "accent",
          }) === 0
        ) {
          hints.push("Final round was triggered by you.");
        } else {
          hints.push(`Final round triggered by ${trigger}.`);
        }
      } else {
        hints.push("Final round is in progress.");
      }
    }
    return hints;
  }, [pendingLocalColumns, state, normalizedLocalName, isSubmittingAction]);

  const combinedInstruction = useMemo(() => {
    if (!instructionMessage) {
      return "";
    }
    if (!instructionHints.length) {
      return instructionMessage;
    }
    return `${instructionMessage} · ${instructionHints.join(" · ")}`;
  }, [instructionMessage, instructionHints]);

  const toggleLogExpansion = () => {
    setIsLogExpanded((previous) => !previous);
  };

  const resetToReplaceMode = () => {
    if (!drawnBelongsToLocal) {
      return;
    }
    setMainActionMode("replace");
    setPendingDiscardReveal(false);
  };

  useEffect(() => {
    if (!drawnBelongsToLocal || drawnFromDiscard) {
      setMainActionMode("replace");
      setPendingDiscardReveal(false);
    }
  }, [
    drawnBelongsToLocal,
    drawnFromDiscard,
    drawnCard?.playerName,
    drawnCard?.value,
  ]);

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

    const handleDiscardAreaClick = () => {
      if (!canDropOnDiscard || mainActionMode === "reveal") {
        return;
      }
      setMainActionMode("reveal");
      setPendingDiscardReveal(true);
    };

    const deckTitle = canDrawFromDeck
      ? "Draw a card from the deck"
      : "Deck of cards";
    const allowDiscardDrop = canDropOnDiscard;
    const showPendingDiscardCard =
      pendingDiscardReveal && allowDiscardDrop && Boolean(drawnCard);
    const hasVisibleDiscardCard =
      Boolean(deck?.firstCard) && deck.firstCard.visible !== false;
    const shouldShowDiscardImage =
      showPendingDiscardCard || hasVisibleDiscardCard;

    const discardImageSrc = showPendingDiscardCard
      ? (drawnCard?.image ?? null)
      : (deck?.firstCard?.image ?? null);
    const discardAltText = showPendingDiscardCard
      ? `Pending discard ${drawnCard?.value ?? ""}`.trim()
      : (deck?.firstCard?.alt ?? "Visible top card");
    const discardTitle = showPendingDiscardCard
      ? "Select one of your hidden cards to reveal"
      : allowDiscardDrop
        ? "Click here to discard the drawn card"
        : canDrawFromDiscard
          ? "Take the top discard card"
          : (deck?.firstCard?.alt ?? "Visible top card");
    let discardClickHandler = undefined;
    if (showPendingDiscardCard) {
      discardClickHandler = undefined;
    } else if (allowDiscardDrop) {
      discardClickHandler = handleDiscardAreaClick;
    } else if (canDrawFromDiscard) {
      discardClickHandler = handleDrawFromDiscard;
    }

    const baseImageClasses = ["deck-entry__image", "deck-entry__image--base"];
    if (canDrawFromDeck) {
      baseImageClasses.push("deck-entry__image--interactive");
      if (shouldShakeDiscard || shouldShakeDrawSources) {
        baseImageClasses.push("shake-animation");
      }
    }

    const topCardClasses = ["deck-entry__image", "deck-entry__image--top-card"];
    if (canDrawFromDiscard || canDropOnDiscard) {
      topCardClasses.push("deck-entry__image--interactive");
      if (shouldShakeDiscard || shouldShakeDrawSources) {
        topCardClasses.push("shake-animation");
      }
    }

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
          { className: "player-entry deck-entry" },
          React.createElement(
            "div",
            {
              className: "deck-entry__images",
            },
            React.createElement("img", {
              className: baseImageClasses.join(" "),
              src: deck.backImage ?? deck.baseImage,
              alt: "Deck of cards",
              title: deckTitle,
              onClick: canDrawFromDeck ? handleDrawFromDeck : undefined,
            }),
            shouldShowDiscardImage && discardImageSrc
              ? React.createElement("img", {
                  className: topCardClasses.join(" "),
                  src: discardImageSrc,
                  alt: discardAltText,
                  title: discardTitle,
                  onClick: discardClickHandler ?? undefined,
                })
              : React.createElement("div", {
                  className: [
                    "deck-entry__drop-zone",
                    shouldShakeDiscard ? "shake-animation" : null,
                  ]
                    .filter(Boolean)
                    .join(" "),
                  title: discardTitle,
                  onClick: discardClickHandler ?? undefined,
                })
          ),
          null
        )
      )
    );
  }

  players.forEach((player, index) => {
    const seat = layout.seats[index] ?? layout.seats[layout.seats.length - 1];
    const handMatrix = Array.isArray(player.handMatrix)
      ? player.handMatrix
      : [];
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
    const isCurrentTurn =
      normalizedActiveName.length > 0 &&
      normalizedPlayerName.length > 0 &&
      normalizedActiveName.localeCompare(normalizedPlayerName, undefined, {
        sensitivity: "accent",
      }) === 0;
    const hasInlineDrawnCard = isDrawnCardOwner && Boolean(drawnCard);
    const showInlineDrawnCard = hasInlineDrawnCard && !pendingDiscardReveal;
    const needsInitialFlipIndicator =
      phase === "initial-flip" &&
      requiredInitialReveals > 0 &&
      flippedPositions.size < requiredInitialReveals;
    const shouldShowIndicator = needsInitialFlipIndicator || isCurrentTurn;
    const playerColumnSet =
      pendingColumnRemovalMap.get(player.name) ??
      pendingColumnRemovalMap.get(normalizedPlayerName) ??
      null;
    const rowOffsets = [];
    handMatrix.reduce((offset, row, rowIndex) => {
      rowOffsets[rowIndex] = offset;
      return offset + row.length;
    }, 0);
    const labelRowElement = React.createElement(
      "div",
      {
        className: "player-entry__hand-row player-entry__hand-row--label",
        style: {
          gridTemplateColumns: showInlineDrawnCard
            ? "auto 1fr var(--card-width)"
            : "auto 1fr",
        },
      },
      shouldShowIndicator
        ? React.createElement("img", {
            className: "player-entry__indicator",
            src: "./assets/images/here.gif",
            alt: "Current turn indicator",
          })
        : React.createElement("span", {
            className: "player-entry__indicator-placeholder",
          }),
      React.createElement(
        "div",
        { className: "player-entry__hand-label" },
        player.name
      ),
      showInlineDrawnCard
        ? React.createElement("img", {
            className: ["drawn-card__image", "drawn-card__image--inline"]
              .filter(Boolean)
              .join(" "),
            src: drawnCard.image,
            alt: `Drawn card ${drawnCard.value}`,
            draggable: false,
            onClick: drawnBelongsToLocal ? resetToReplaceMode : undefined,
            style: {
              cursor: drawnBelongsToLocal ? "pointer" : "default",
            },
          })
        : null
    );

    const cardRowElements = handMatrix.map((row, rowIndex) =>
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
          if (allowReplace) {
            cardClasses.push("player-entry__card--drop-target");
          }
          if (onCardClick) {
            cardClasses.push("player-entry__card--interactive");
          } else {
            cardClasses.push("player-entry__card--inactive");
          }
          if (playerColumnSet?.has(cardIndex)) {
            cardClasses.push("player-entry__card--removal-pending");
          } else if (allowReplace || allowReveal || canFlip) {
            cardClasses.push("shake-animation");
          }

          return React.createElement("img", {
            key: `card-${rowIndex}-${cardIndex}`,
            className: cardClasses.join(" "),
            src: cardData.image,
            alt: `${player.name} card ${cardValue}`,
            title: cardTitle,
            onClick: onCardClick ?? undefined,
            draggable: false,
          });
        })
      )
    );

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
          labelRowElement,
          ...cardRowElements
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
      columnRemovalNotices.length
        ? React.createElement(
            "div",
            { className: "column-removal-notifications" },
            columnRemovalNotices.map((notice) => {
              const columnLabel =
                Array.isArray(notice.columns) && notice.columns.length
                  ? notice.columns.map((column) => column + 1).join(", ")
                  : "?";
              return React.createElement(
                "div",
                {
                  key: notice.id,
                  className: "column-removal-notification",
                },
                `Column ${columnLabel} removed for player ${notice.playerName}`
              );
            })
          )
        : null,
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
    React.createElement(
      "section",
      { className: "game-status", "aria-live": "polite" },
      React.createElement(
        "div",
        { className: "game-status__line" },
        React.createElement(
          "span",
          { className: "game-status__phase setup__current-room-value" },
          friendlyPhaseLabel
        ),
        React.createElement(
          "p",
          {
            className: "game-status__message",
            title: combinedInstruction,
          },
          combinedInstruction
        ),
        React.createElement(
          "button",
          {
            type: "button",
            className: "game-status__toggle",
            onClick: toggleLogExpansion,
            "aria-expanded": isLogExpanded,
            "aria-controls": "game-log-panel",
          },
          isLogExpanded
            ? "Hide Log"
            : `Show Log${logEntryCount ? ` (${logEntryCount})` : ""}`
        )
      ),
      isLogExpanded
        ? React.createElement(
            "div",
            { className: "game-status__log", id: "game-log-panel" },
            formattedLogEntries.length
              ? React.createElement(
                  "ul",
                  {
                    className: "game-status__log-list",
                    "aria-label": "Game log entries",
                  },
                  formattedLogEntries.map((entry, index) =>
                    React.createElement(
                      "li",
                      { key: `${index}-${entry}` },
                      entry
                    )
                  )
                )
              : React.createElement(
                  "p",
                  { className: "game-status__log-empty" },
                  "Log is empty."
                )
          )
        : null
    )
  );
}
