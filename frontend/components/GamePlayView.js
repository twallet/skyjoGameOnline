import React, {
  useEffect,
  useMemo,
  useState,
} from "https://esm.sh/react@18?dev";

import {
  buildPossessiveTurnLabel,
  normalizeOptionalString,
  normalizePlayerName,
} from "../utils/appHelpers.js";

/**
 * Renders the main game play view for Skyjo, displaying player hands, deck, discard pile,
 * game status, and handling all game interactions.
 *
 * @param {Object} props - Component props
 * @param {Array<Object>} props.activePlayers - Array of active player objects with hand matrices
 * @param {Object|null} props.deck - Deck object with baseImage and firstCard properties
 * @param {Object|null} props.snapshot - Game snapshot containing state and log entries
 * @param {Object|null} props.gameState - Current game state (takes precedence over snapshot)
 * @param {string} props.localPlayerName - Name of the local player
 * @param {Array<string|Object>} props.logEntries - Array of log entry strings or objects
 * @param {Function|null} props.onFlipCard - Callback when a card is flipped (playerName, position)
 * @param {Function|null} props.onDrawCard - Callback when a card is drawn (playerName, source)
 * @param {Function|null} props.onReplaceCard - Callback when a card is replaced (playerName, position)
 * @param {Function|null} props.onRevealCard - Callback when a card is revealed (playerName, position)
 * @param {Function|null} props.onPlayAgain - Callback when play again button is clicked
 * @param {boolean} props.isProcessing - Whether the component is processing an async operation
 * @returns {React.ReactElement} The rendered game play view component
 */
export function GamePlayView({
  activePlayers,
  deck,
  snapshot = null,
  gameState = null,
  localPlayerName = "",
  logEntries = [],
  onFlipCard = null,
  onDrawCard = null,
  onReplaceCard = null,
  onRevealCard = null,
  onPlayAgain = null,
  isProcessing = false,
}) {
  // Normalize activePlayers to ensure it's always an array
  const players = Array.isArray(activePlayers) ? activePlayers : [];
  // Reference to the grid container element for card size calculations
  const gridRef = React.useRef(null);
  // CSS custom properties for dynamic card sizing based on available space
  const [cardSizeStyle, setCardSizeStyle] = useState({});

  /**
   * Calculates the maximum number of columns across all player hands.
   * Since all rows have the same size in Skyjo, we can use the first row's length.
   * Used to determine card sizing and layout constraints.
   * @type {number}
   */
  const maxHandColumns = React.useMemo(() => {
    if (!players.length) {
      return 4;
    }

    return players.reduce((maxCols, player) => {
      const handMatrix = Array.isArray(player.handMatrix)
        ? player.handMatrix
        : [];
      // All rows have the same size, so we can use the first row's length
      const columnCount =
        handMatrix.length > 0 && Array.isArray(handMatrix[0])
          ? handMatrix[0].length
          : 0;
      return Math.max(maxCols, Math.max(1, columnCount));
    }, 4);
  }, [players]);

  /**
   * Grid layout configurations for different player counts.
   * Defines column/row counts, deck position, and player seat positions.
   * @type {Object<number, Object>}
   */
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

  /**
   * Total number of active players in the game.
   * @type {number}
   */
  const playerCount = players.length;
  /**
   * Grid layout configuration for the current player count.
   * Falls back to the 8-player layout if player count exceeds available layouts.
   * @type {Object}
   */
  const layout = layouts[playerCount] ?? layouts[Math.min(playerCount, 8)];

  /**
   * Effect hook that calculates and updates card sizes based on available space.
   * Responds to changes in player count, layout, and hand column count.
   * Sets up ResizeObserver and window resize listener to recalculate on size changes.
   */
  useEffect(() => {
    // Constants for card sizing calculations
    const CARD_GAP_PX = 12; // Gap between cards in pixels
    const PLAYER_HORIZONTAL_PADDING = 32; // Horizontal padding per player area
    const MAX_CARD_WIDTH = 110; // Maximum card width in pixels
    const MIN_CARD_WIDTH = 40; // Minimum card width in pixels

    /**
     * Calculates optimal card size based on available grid space and updates CSS variables.
     * Considers: grid dimensions, player count, hand column count, and card aspect ratio (7:10).
     */
    const updateCardSize = () => {
      if (!gridRef.current) {
        return;
      }

      // Get grid container dimensions and computed styles
      const bounding = gridRef.current.getBoundingClientRect();
      const computedGridStyle = window.getComputedStyle(gridRef.current);
      const columnGap = parseFloat(computedGridStyle.columnGap || "16");
      const rowGap = parseFloat(computedGridStyle.rowGap || "16");

      // Calculate grid layout dimensions
      const playerCount = Math.max(players.length, 1);
      const gridColumns =
        layout.columns || Math.min(Math.max(playerCount, 1), 3);
      const gridRows = Math.ceil(playerCount / gridColumns);

      // Calculate available space per player (accounting for gaps)
      const availableWidthPerPlayer =
        (bounding.width - columnGap * Math.max(gridColumns - 1, 0)) /
        gridColumns;
      const availableHeightPerPlayer =
        (bounding.height - rowGap * Math.max(gridRows - 1, 0)) / gridRows;

      // Calculate minimum inner width needed (ensures cards don't get too small)
      const innerWidth = Math.max(
        availableWidthPerPlayer - PLAYER_HORIZONTAL_PADDING,
        MIN_CARD_WIDTH * maxHandColumns
      );
      // Calculate card width based on available columns (accounting for gaps between cards)
      const cardWidthByColumns =
        (innerWidth - CARD_GAP_PX * Math.max(maxHandColumns - 1, 0)) /
        Math.max(maxHandColumns, 1);
      // Calculate card height based on available rows (3 rows per hand, accounting for padding)
      const cardHeightByRows =
        (availableHeightPerPlayer - PLAYER_HORIZONTAL_PADDING) / 3;

      // Determine final card width (constrained by min/max and aspect ratio)
      // Aspect ratio: cards are 7:10 (width:height), so height-based width = (height * 7) / 10
      const computedWidth = Math.max(
        MIN_CARD_WIDTH,
        Math.min(
          cardWidthByColumns,
          (cardHeightByRows * 7) / 10,
          MAX_CARD_WIDTH
        )
      );
      // Calculate card height maintaining 7:10 aspect ratio
      const computedHeight = (computedWidth * 10) / 7;
      // Calculate total hand width (all columns + gaps between them)
      const handWidth =
        maxHandColumns * computedWidth +
        Math.max(maxHandColumns - 1, 0) * CARD_GAP_PX;

      // Update CSS custom properties for dynamic card sizing
      setCardSizeStyle({
        "--card-width": `${computedWidth}px`,
        "--card-height": `${computedHeight}px`,
        "--hand-columns": maxHandColumns,
        "--hand-width": `${handWidth}px`,
        "--card-gap": `${CARD_GAP_PX}px`,
      });
    };

    // Initial calculation
    updateCardSize();
    // Set up ResizeObserver to recalculate when grid container size changes
    const resizeObserver = new ResizeObserver(updateCardSize);
    if (gridRef.current) {
      resizeObserver.observe(gridRef.current);
    }
    // Set up window resize listener as fallback
    window.addEventListener("resize", updateCardSize);

    // Cleanup: remove listeners and observer
    return () => {
      window.removeEventListener("resize", updateCardSize);
      if (gridRef.current) {
        resizeObserver.unobserve(gridRef.current);
      }
    };
  }, [players, layout.columns, maxHandColumns]);

  /**
   * Current game state, prioritized from gameState prop, then snapshot, or null.
   * @type {Object|null}
   */
  const state = gameState ?? (snapshot ? snapshot.state : null) ?? null;
  /**
   * Current game phase (e.g., "initial-flip", "main-play", "final-round", "finished").
   * @type {string|null}
   */
  const phase = state?.phase ?? null;
  /**
   * Initial flip phase state containing player flip information.
   * @type {Object|null}
   */
  const initialFlipState = state?.initialFlip ?? null;
  /**
   * Array of players participating in the initial flip phase.
   * All players participate in the initial flip phase.
   * @type {Array<Object>}
   */
  const initialFlipPlayers = initialFlipState?.players ?? [];
  /**
   * Number of cards each player must reveal during the initial flip phase.
   * @type {number}
   */
  const requiredInitialReveals = initialFlipState?.requiredReveals ?? 0;
  /**
   * Currently drawn card object, if any player has drawn a card.
   * @type {Object|null}
   */
  const drawnCard = state?.drawnCard ?? null;
  /**
   * Name of the currently active player.
   * @type {string|null}
   */
  const activeName = state?.activePlayer?.name ?? null;
  /**
   * Normalized (trimmed) local player name for comparison.
   * @type {string}
   */
  const normalizedLocalName = normalizePlayerName(localPlayerName);
  /**
   * Normalized (trimmed) active player name for comparison.
   * @type {string}
   */
  const normalizedActiveName = normalizePlayerName(activeName);
  /**
   * Whether the local player is currently the active player.
   * @type {boolean}
   */
  const isLocalActive =
    normalizedLocalName.length > 0 &&
    normalizedActiveName.length > 0 &&
    normalizedLocalName.localeCompare(normalizedActiveName, undefined, {
      sensitivity: "accent",
    }) === 0;
  /**
   * Whether the currently drawn card belongs to the local player.
   * @type {boolean}
   */
  const drawnBelongsToLocal =
    Boolean(drawnCard) &&
    typeof drawnCard.playerName === "string" &&
    normalizedLocalName.length > 0 &&
    drawnCard.playerName.localeCompare(normalizedLocalName, undefined, {
      sensitivity: "accent",
    }) === 0;
  /**
   * Source of the drawn card ("deck" or "discard"), normalized to lowercase.
   * @type {string}
   */
  const drawnSource =
    typeof drawnCard?.source === "string" ? drawnCard.source.toLowerCase() : "";
  /**
   * Whether the drawn card was taken from the discard pile.
   * @type {boolean}
   */
  const drawnFromDiscard = drawnSource === "discard";
  /**
   * Whether the local player can control card draws (active, no drawn card, callback available, not processing).
   * @type {boolean}
   */
  const canControlDraws =
    isLocalActive &&
    !drawnCard &&
    typeof onDrawCard === "function" &&
    !isProcessing;
  /**
   * Whether the local player can draw from the deck.
   * @type {boolean}
   */
  const canDrawFromDeck = canControlDraws;
  /**
   * Whether the local player can draw from the discard pile (requires visible discard card).
   * @type {boolean}
   */
  const canDrawFromDiscard =
    canControlDraws &&
    Boolean(deck?.firstCard) &&
    deck.firstCard.visible !== false;

  /**
   * Current main action mode: "replace" (replace a card) or "reveal" (reveal a hidden card).
   * @type {[string, Function]}
   */
  const [mainActionMode, setMainActionMode] = useState("replace");
  /**
   * Whether a discard reveal is pending (player discarded and must reveal a card).
   * @type {[boolean, Function]}
   */
  const [pendingDiscardReveal, setPendingDiscardReveal] = useState(false);
  /**
   * Whether the game log panel is expanded.
   * @type {[boolean, Function]}
   */
  const [isLogExpanded, setIsLogExpanded] = useState(false);
  /**
   * Whether the local player can drop/discard the drawn card.
   * @type {boolean}
   */
  const canDropOnDiscard = drawnBelongsToLocal && !drawnFromDiscard;
  /**
   * Whether the local player can resolve the drawn card (has drawn card, not processing).
   * @type {boolean}
   */
  const canResolveDrawnCard =
    drawnBelongsToLocal && !isProcessing && Boolean(drawnCard);
  /**
   * Whether the discard area should show shake animation (indicates drop target).
   * @type {boolean}
   */
  const shouldShakeDiscard =
    drawnBelongsToLocal && mainActionMode === "replace" && canDropOnDiscard;
  /**
   * Whether draw sources (deck/discard) should show shake animation (indicates available actions).
   * @type {boolean}
   */
  const shouldShakeDrawSources =
    isLocalActive && !drawnCard && (canDrawFromDeck || canDrawFromDiscard);
  /**
   * Array of column removal notification objects to display.
   * @type {[Array<Object>, Function]}
   */
  const [columnRemovalNotices, setColumnRemovalNotices] = useState([]);
  /**
   * Set of column removal event IDs that have already been displayed.
   * Used to prevent duplicate notifications.
   * @type {React.MutableRefObject<Set<string>>}
   */
  const displayedColumnRemovalIdsRef = React.useRef(new Set());

  /**
   * Map of player names to sets of column indices pending removal.
   * Computed from game state's pendingColumnRemovals array.
   * @type {Map<string, Set<number>>}
   */
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

  /**
   * Effect hook that processes recent column removal events and adds them to notifications.
   * Filters out events that have already been displayed to prevent duplicates.
   */
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

  /**
   * Effect hook that periodically removes expired column removal notifications.
   * Runs every 200ms to clean up notifications that have passed their expiration time.
   */
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

  /**
   * Processed log entries with normalized message formatting and metadata.
   * Ensures messages end with punctuation and extracts phase/actor information.
   * @type {Array<Object>}
   */
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
        const phase = normalizeOptionalString(entry.phase);
        const actor = normalizeOptionalString(entry.actor);
        return { message, phase, actor };
      }
      const rawMessage =
        typeof entry === "string" ? entry : String(entry ?? "");
      const message = /[.!?]$/.test(rawMessage) ? rawMessage : `${rawMessage}.`;
      return { message, phase: null, actor: null };
    });
  }, [logEntries, snapshot?.logEntries]);

  /**
   * Maximum number of log entries to display at once.
   * @type {number}
   */
  const MAX_LOG_ENTRIES = 20;
  /**
   * Visible log entries, limited to MAX_LOG_ENTRIES and reversed for newest-first display.
   * @type {Array<Object>}
   */
  const visibleLogEntries = useMemo(() => {
    const trimmed = eventEntries.slice(-MAX_LOG_ENTRIES);
    return trimmed.reverse();
  }, [eventEntries]);

  /**
   * Display name of the currently active player, trimmed of whitespace.
   * @type {string}
   */
  const activePlayerDisplayName = normalizePlayerName(
    state?.activePlayer?.name
  );

  /**
   * Color associated with the active player, if specified.
   * @type {string|null}
   */
  const activePlayerColor =
    typeof state?.activePlayer?.color === "string" &&
    state.activePlayer.color.trim().length > 0
      ? state.activePlayer.color
      : null;

  /**
   * Human-readable phase label for display in the UI.
   * Includes player name in possessive form during main-play phase.
   * @type {string}
   */
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
          const turnLabel = buildPossessiveTurnLabel(activePlayerDisplayName);
          return `Playing | ${turnLabel}`;
        }
        return "Playing";
      }
      case "final-round":
        return "Final Round";
      case "finished":
        return "Game over";
      default:
        return "Preparation";
    }
  }, [state?.phase, activePlayerDisplayName]);

  /**
   * Log entries formatted as strings for display in the log panel.
   * Extracts message text from event entry objects.
   * @type {Array<string>}
   */
  const formattedLogEntries = useMemo(
    () =>
      visibleLogEntries.map((entry) =>
        typeof entry.message === "string"
          ? entry.message
          : String(entry.message ?? "")
      ),
    [visibleLogEntries]
  );

  /**
   * Whether the game is in the finished phase.
   * @type {boolean}
   */
  const isFinishedPhase = state?.phase === "finished";
  /**
   * Final round scores sorted by total (ascending), with ties broken by name.
   * Lower scores are better in Skyjo.
   * @type {Array<Object>|null}
   */
  const finalRoundScores = useMemo(() => {
    if (!Array.isArray(state?.finalRound?.scores)) {
      return null;
    }
    return [...state.finalRound.scores].sort((a, b) => {
      const totalA = Number.isFinite(a?.total)
        ? a.total
        : Number.POSITIVE_INFINITY;
      const totalB = Number.isFinite(b?.total)
        ? b.total
        : Number.POSITIVE_INFINITY;
      if (totalA === totalB) {
        return String(a?.name ?? "").localeCompare(String(b?.name ?? ""));
      }
      return totalA - totalB;
    });
  }, [state?.finalRound?.scores]);

  /**
   * Name of the game winner, determined from finalRound.winner or lowest score.
   * @type {string|null}
   */
  const winnerName = isFinishedPhase
    ? (state?.finalRound?.winner ??
      (finalRoundScores?.length ? (finalRoundScores[0]?.name ?? null) : null))
    : null;

  /**
   * Final round scores ordered with winner first, if winner is identified.
   * Otherwise returns scores in their original sorted order.
   * @type {Array<Object>}
   */
  const orderedFinalRoundScores = useMemo(() => {
    if (!Array.isArray(finalRoundScores) || finalRoundScores.length === 0) {
      return [];
    }
    if (!winnerName) {
      return finalRoundScores;
    }
    const normalizedWinner = winnerName.trim().toLowerCase();
    const winnerIndex = finalRoundScores.findIndex((entry) => {
      if (typeof entry?.name !== "string") {
        return false;
      }
      return entry.name.trim().toLowerCase() === normalizedWinner;
    });
    if (winnerIndex <= 0) {
      return finalRoundScores;
    }
    const winnerEntry = finalRoundScores[winnerIndex];
    const remainingEntries = finalRoundScores.filter(
      (_entry, index) => index !== winnerIndex
    );
    return [winnerEntry, ...remainingEntries];
  }, [finalRoundScores, winnerName]);

  /**
   * Current instruction message to display to the player based on game state.
   * Provides context-specific guidance for what action the player should take.
   * @type {string}
   */
  const instructionMessage = useMemo(() => {
    if (isProcessing) {
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
      if (winnerName) {
        return `${winnerName} wins the game.`;
      }
      return "Game over. Final scores are available in the log.";
    }

    return "Waiting for the latest game state...";
  }, [
    isProcessing,
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
    winnerName,
  ]);

  /**
   * Final instruction message with normalized punctuation.
   * Removes trailing periods and ensures single period at end.
   * @type {string}
   */
  const combinedInstruction = useMemo(() => {
    if (!instructionMessage) {
      return "";
    }

    if (
      state?.finalRound?.triggeredBy &&
      instructionMessage.includes(state.finalRound.triggeredBy)
    ) {
      return instructionMessage.replace(/\s*\.+\s*$/, ".");
    }

    return instructionMessage.replace(/\s*\.+\s*$/, ".");
  }, [instructionMessage, state?.finalRound?.triggeredBy]);

  /**
   * Toggles the log expansion state.
   * Used to show/hide the game log panel.
   */
  const toggleLogExpansion = () => {
    setIsLogExpanded((previous) => !previous);
  };

  /**
   * Resets the main action mode to "replace" and clears pending discard reveal.
   * Only works if the drawn card belongs to the local player.
   */
  const resetToReplaceMode = () => {
    if (!drawnBelongsToLocal) {
      return;
    }
    setMainActionMode("replace");
    setPendingDiscardReveal(false);
  };

  /**
   * Effect hook that resets action mode to "replace" when drawn card changes.
   * Ensures UI state stays in sync with game state when card ownership or source changes.
   */
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

  /**
   * Effect hook that automatically expands the log panel when game finishes.
   * Ensures final scores and game log are visible at game end.
   */
  useEffect(() => {
    if (state?.phase === "finished") {
      setIsLogExpanded(true);
    }
  }, [state?.phase]);

  /**
   * CSS styles for the players grid container.
   * Defines grid layout with dynamic column count based on player count.
   * @type {Object}
   */
  const gridListStyle = {
    display: "grid",
    gridTemplateColumns: `repeat(${layout.columns}, minmax(0, 1fr))`,
    gridAutoRows: "auto",
    gap: "0.75rem",
    justifyItems: "stretch",
    alignItems: "center",
    justifyContent: "center",
  };

  /**
   * Array of React elements representing player entries and deck/discard area.
   * Populated during rendering based on game state.
   * @type {Array<React.ReactElement>}
   */
  const playerEntries = [];

  /**
   * Renders the final scores panel displayed when the game is finished.
   * Shows ordered scores with winner highlighted, and includes a "Play again" button.
   * @returns {React.ReactElement} Final scores panel element
   */
  const renderFinalScoresPanel = () => {
    const hasScores =
      Array.isArray(orderedFinalRoundScores) &&
      orderedFinalRoundScores.length > 0;
    return React.createElement(
      "div",
      {
        key: "final-scores",
        className: "final-summary",
        style: {
          gridColumn: `${layout.deck.colStart} / ${layout.deck.colEnd}`,
          gridRow: `${layout.deck.rowStart} / ${layout.deck.rowEnd}`,
        },
      },
      React.createElement(
        "h3",
        { className: "final-summary__title" },
        "Final Scores"
      ),
      hasScores
        ? React.createElement(
            "ol",
            { className: "final-summary__list", "aria-label": "Final scores" },
            orderedFinalRoundScores.map((entry, index) =>
              React.createElement(
                "li",
                { key: `${entry.name ?? index}-${entry.total}` },
                React.createElement(
                  "span",
                  { className: "final-summary__player" },
                  `${entry.name ?? `Player ${index + 1}`}${
                    entry.doubled ? " (x2)" : ""
                  }`
                ),
                React.createElement(
                  "span",
                  { className: "final-summary__total" },
                  `${entry.total ?? "?"} pts`
                )
              )
            )
          )
        : React.createElement(
            "p",
            { className: "final-summary__empty" },
            "No final scores reported."
          ),
      React.createElement(
        "button",
        {
          type: "button",
          className: "final-summary__action",
          onClick: typeof onPlayAgain === "function" ? onPlayAgain : undefined,
          disabled: typeof onPlayAgain !== "function" || isProcessing,
        },
        "Play again"
      )
    );
  };

  if (deck && !isFinishedPhase) {
    /**
     * Handler function for drawing a card from the deck.
     * Validates conditions and calls onDrawCard callback with "deck" source.
     */
    const handleDrawFromDeck = () => {
      if (!normalizedLocalName || !canDrawFromDeck) {
        return;
      }
      onDrawCard?.(normalizedLocalName, "deck");
    };

    /**
     * Handler function for drawing a card from the discard pile.
     * Validates conditions and calls onDrawCard callback with "discard" source.
     */
    const handleDrawFromDiscard = () => {
      if (!normalizedLocalName || !canDrawFromDiscard) {
        return;
      }
      onDrawCard?.(normalizedLocalName, "discard");
    };

    /**
     * Handler function for clicking the discard area.
     * Switches to "reveal" mode and sets pending discard reveal flag.
     */
    const handleDiscardAreaClick = () => {
      if (!canDropOnDiscard || mainActionMode === "reveal") {
        return;
      }
      setMainActionMode("reveal");
      setPendingDiscardReveal(true);
    };

    /**
     * Title text for the deck image, varies based on whether player can draw.
     * @type {string}
     */
    const deckTitle = canDrawFromDeck
      ? "Draw a card from the deck"
      : "Deck of cards";
    /**
     * Whether the discard area allows dropping the drawn card.
     * @type {boolean}
     */
    const allowDiscardDrop = canDropOnDiscard;
    /**
     * Whether to show the pending discard card (card being discarded but not yet placed).
     * @type {boolean}
     */
    const showPendingDiscardCard =
      pendingDiscardReveal && allowDiscardDrop && Boolean(drawnCard);
    /**
     * Whether there is a visible card on top of the discard pile.
     * @type {boolean}
     */
    const hasVisibleDiscardCard =
      Boolean(deck?.firstCard) && deck.firstCard.visible !== false;
    /**
     * Whether the discard area should display a card image.
     * @type {boolean}
     */
    const shouldShowDiscardImage =
      showPendingDiscardCard || hasVisibleDiscardCard;

    /**
     * Image source URL for the discard card display.
     * Shows pending discard card if available, otherwise top discard card.
     * @type {string|null}
     */
    const discardImageSrc = showPendingDiscardCard
      ? (drawnCard?.image ?? null)
      : (deck?.firstCard?.image ?? null);
    /**
     * Alt text for the discard card image.
     * @type {string}
     */
    const discardAltText = showPendingDiscardCard
      ? `Pending discard ${drawnCard?.value ?? ""}`.trim()
      : (deck?.firstCard?.alt ?? "Visible top card");
    /**
     * Title/tooltip text for the discard area, varies based on current game state.
     * @type {string}
     */
    const discardTitle = showPendingDiscardCard
      ? "Select one of your hidden cards to reveal"
      : allowDiscardDrop
        ? "Click here to discard the drawn card"
        : canDrawFromDiscard
          ? "Take the top discard card"
          : (deck?.firstCard?.alt ?? "Visible top card");
    /**
     * Click handler function for the discard area, or undefined if not clickable.
     * @type {Function|undefined}
     */
    let discardClickHandler = undefined;
    if (showPendingDiscardCard) {
      discardClickHandler = undefined;
    } else if (allowDiscardDrop) {
      discardClickHandler = handleDiscardAreaClick;
    } else if (canDrawFromDiscard) {
      discardClickHandler = handleDrawFromDiscard;
    }

    /**
     * CSS class names for the deck base image.
     * Includes interactive and shake animation classes when appropriate.
     * @type {Array<string>}
     */
    const baseImageClasses = ["deck-entry__image", "deck-entry__image--base"];
    if (canDrawFromDeck) {
      baseImageClasses.push("deck-entry__image--interactive");
      if (shouldShakeDiscard || shouldShakeDrawSources) {
        baseImageClasses.push("shake-animation");
      }
    }

    /**
     * CSS class names for the discard pile top card image.
     * Includes interactive and shake animation classes when appropriate.
     * @type {Array<string>}
     */
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
            deck.baseImage
              ? React.createElement("img", {
                  className: baseImageClasses.join(" "),
                  src: deck.baseImage,
                  alt: "Deck of cards",
                  title: deckTitle,
                  onClick: canDrawFromDeck ? handleDrawFromDeck : undefined,
                })
              : null,
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
  } else if (isFinishedPhase) {
    playerEntries.push(renderFinalScoresPanel());
  }

  players.forEach((player, index) => {
    /**
     * Grid seat position for this player in the layout.
     * Falls back to last seat if index exceeds available seats.
     * @type {Object}
     */
    const seat = layout.seats[index] ?? layout.seats[layout.seats.length - 1];
    /**
     * Player's hand matrix (2D array of card data).
     * @type {Array<Array<Object>>}
     */
    const handMatrix = Array.isArray(player.handMatrix)
      ? player.handMatrix
      : [];
    /**
     * Initial flip phase information for this player, if available.
     * @type {Object|undefined}
     */
    const initialFlipInfo = initialFlipPlayers.find(
      (entry) => entry?.name === player.name
    );
    /**
     * Set of card positions that have been flipped during initial flip phase.
     * @type {Set<number>}
     */
    const flippedPositions = new Set(
      Array.isArray(initialFlipInfo?.flippedPositions)
        ? initialFlipInfo.flippedPositions
        : []
    );
    /**
     * Normalized (trimmed) player name for comparison.
     * @type {string}
     */
    const normalizedPlayerName = normalizePlayerName(player.name);
    /**
     * Whether this player is the local player.
     * @type {boolean}
     */
    const isLocalPlayer =
      normalizedLocalName.length > 0 &&
      normalizedPlayerName.length > 0 &&
      normalizedLocalName.localeCompare(normalizedPlayerName, undefined, {
        sensitivity: "accent",
      }) === 0;
    /**
     * Whether this player owns the currently drawn card.
     * @type {boolean}
     */
    const isDrawnCardOwner =
      Boolean(drawnCard?.playerName) &&
      normalizedPlayerName.length > 0 &&
      drawnCard.playerName.localeCompare(normalizedPlayerName, undefined, {
        sensitivity: "accent",
      }) === 0;
    /**
     * Whether this player is currently taking their turn.
     * @type {boolean}
     */
    const isCurrentTurn =
      normalizedActiveName.length > 0 &&
      normalizedPlayerName.length > 0 &&
      normalizedActiveName.localeCompare(normalizedPlayerName, undefined, {
        sensitivity: "accent",
      }) === 0;
    /**
     * Whether this player has a drawn card that should be displayed inline.
     * @type {boolean}
     */
    const hasInlineDrawnCard = isDrawnCardOwner && Boolean(drawnCard);
    /**
     * Whether to show the drawn card inline in this player's hand label.
     * Hidden when discard reveal is pending.
     * @type {boolean}
     */
    const showInlineDrawnCard = hasInlineDrawnCard && !pendingDiscardReveal;
    /**
     * Whether this player needs to flip more cards during initial flip phase.
     * @type {boolean}
     */
    const needsInitialFlipIndicator =
      phase === "initial-flip" &&
      requiredInitialReveals > 0 &&
      flippedPositions.size < requiredInitialReveals;
    /**
     * Whether to show the turn indicator for this player.
     * @type {boolean}
     */
    const shouldShowIndicator = needsInitialFlipIndicator || isCurrentTurn;
    /**
     * Set of column indices pending removal for this player, if any.
     * @type {Set<number>|null}
     */
    const playerColumnSet =
      pendingColumnRemovalMap.get(player.name) ??
      pendingColumnRemovalMap.get(normalizedPlayerName) ??
      null;
    /**
     * Array of row offset values for calculating card positions.
     * Each index contains the cumulative card count up to that row.
     * @type {Array<number>}
     */
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
          /**
           * Absolute position index of this card in the player's hand.
           * @type {number}
           */
          const position = rowOffsets[rowIndex] + cardIndex;
          /**
           * Value of this card ("X" for hidden cards, number for revealed).
           * @type {string|number}
           */
          const cardValue = cardData.value;
          /**
           * Whether this card is hidden (value is "X").
           * @type {boolean}
           */
          const isHidden = cardValue === "X";
          /**
           * Whether this card has already been flipped during initial flip phase.
           * @type {boolean}
           */
          const alreadyFlipped = flippedPositions.has(position);
          /**
           * Whether this card can be flipped during initial flip phase.
           * @type {boolean}
           */
          const canFlip =
            phase === "initial-flip" &&
            isLocalPlayer &&
            typeof onFlipCard === "function" &&
            requiredInitialReveals > flippedPositions.size &&
            isHidden &&
            !alreadyFlipped &&
            !isProcessing;

          /**
           * Whether this card can be replaced with the drawn card.
           * @type {boolean}
           */
          const allowReplace =
            isLocalPlayer &&
            canResolveDrawnCard &&
            mainActionMode === "replace" &&
            typeof onReplaceCard === "function";
          /**
           * Whether this hidden card can be revealed (after discarding).
           * @type {boolean}
           */
          const allowReveal =
            isLocalPlayer &&
            canResolveDrawnCard &&
            mainActionMode === "reveal" &&
            typeof onRevealCard === "function" &&
            isHidden;
          /**
           * Click handler function for this card, or null if not clickable.
           * @type {Function|null}
           */
          let onCardClick = null;
          /**
           * Title/tooltip text for this card.
           * @type {string}
           */
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

          /**
           * CSS class names for this card element.
           * Includes state-based classes for interactivity, drop targets, and animations.
           * @type {Array<string>}
           */
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
          {
            className: [
              "game-status__phase",
              "setup__current-room-value",
              state?.phase ? `game-status__phase--${state.phase}` : null,
              activePlayerColor ? "game-status__phase--custom" : null,
            ]
              .filter(Boolean)
              .join(" "),
            style: activePlayerColor
              ? {
                  backgroundColor: activePlayerColor,
                  borderColor: activePlayerColor,
                  color: "#0b2540",
                }
              : undefined,
          },
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
          isLogExpanded ? "Hide log" : "Show log"
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
