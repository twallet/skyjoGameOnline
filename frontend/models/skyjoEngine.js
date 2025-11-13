import { resolveLogger, noopLogger } from "../utils/logger.js";

export const SkyjoPhases = Object.freeze({
  INITIAL_FLIP: "initial-flip",
  MAIN_PLAY: "main-play",
  FINAL_ROUND: "final-round",
  FINISHED: "finished",
});

const INITIAL_FLIP_REVEALS = 2;
const COLUMN_REMOVAL_DELAY_MS = 3000;

export class SkyjoEngine {
  #game;
  #dealer;
  #players;
  #logger;
  #phase = SkyjoPhases.INITIAL_FLIP;
  #turnOrder = [];
  #turnCursor = 0;
  #activePlayerIndex = null;
  #initialFlipSelections = new Map();
  #initialFlipTotals = new Map();
  #discardPile = [];
  #drawnCard = null;
  #finalRoundQueue = [];
  #finalRoundTrigger = null;
  #pendingColumnRemovals = new Map();
  #recentColumnRemovalEvents = [];
  #stateChangeHandler = null;
  #columnRemovalHandler = null;

  constructor(game, dealer, players, logger = noopLogger, hooks = null) {
    this.#game = SkyjoEngine.#validateGame(game);
    this.#dealer = SkyjoEngine.#validateDealer(dealer);
    this.#players = SkyjoEngine.#validatePlayers(players);
    this.#logger = resolveLogger(logger);

    this.#turnOrder = this.#players.map((_, index) => index);
    this.#turnCursor = 0;
    this.#initializeDiscardPile();

    const options = typeof hooks === "object" && hooks !== null ? hooks : {};
    if (typeof options.onStateChange === "function") {
      this.#stateChangeHandler = options.onStateChange;
    }
    if (typeof options.onColumnsRemoved === "function") {
      this.#columnRemovalHandler = options.onColumnsRemoved;
    }
  }

  get phase() {
    return this.#phase;
  }

  get activePlayerIndex() {
    return this.#activePlayerIndex;
  }

  get activePlayer() {
    if (this.#activePlayerIndex === null) {
      return null;
    }
    return this.#players[this.#activePlayerIndex] ?? null;
  }

  get discardSize() {
    return this.#discardPile.length;
  }

  drawFromDiscard(playerIndex) {
    this.#assertMainPlayPhase();
    this.#assertActivePlayer(playerIndex);
    this.#assertNoPendingDraw();
    this.#resolvePlayerHand(playerIndex);

    if (this.#discardPile.length === 0) {
      throw new Error("Cannot draw from an empty discard pile");
    }

    const card = this.#discardPile.pop();
    card.visible = true;

    this.#drawnCard = {
      playerIndex,
      source: "discard",
      card,
    };

    this.#logger.info(
      `SkyjoEngine: player '${this.#players[playerIndex].name}' drew visible card ${card.value} from discard`
    );

    return {
      playerIndex,
      source: "discard",
      card: {
        value: card.value,
        image: card.image,
      },
    };
  }

  drawFromDeck(playerIndex) {
    this.#assertMainPlayPhase();
    this.#assertActivePlayer(playerIndex);
    this.#assertNoPendingDraw();
    this.#resolvePlayerHand(playerIndex);

    if (!this.#dealer?.deck || this.#dealer.deck.size() === 0) {
      throw new Error("Cannot draw from an empty deck");
    }

    const card = this.#dealer.deck.dealNextCard();
    card.visible = true;

    this.#drawnCard = {
      playerIndex,
      source: "deck",
      card,
    };

    this.#logger.info(
      `SkyjoEngine: player '${this.#players[playerIndex].name}' drew card ${card.value} from deck`
    );

    return {
      playerIndex,
      source: "deck",
      card: {
        value: card.value,
        image: card.image,
      },
    };
  }

  replaceWithDrawnCard(playerIndex, position) {
    this.#assertMainPlayPhase();
    this.#assertActivePlayer(playerIndex);
    this.#assertValidPosition(position);

    const drawn = this.#consumeDrawnCard(playerIndex);
    const hand = this.#resolvePlayerHand(playerIndex);
    drawn.card.visible = true;

    const replacedCard = hand.replaceCard(position, drawn.card);
    replacedCard.visible = true;
    this.#discardPile.push(replacedCard);

    this.#logger.info(
      `SkyjoEngine: player '${this.#players[playerIndex].name}' replaced card at position ${position} with ${drawn.card.value}; discarded ${replacedCard.value}`
    );

    this.#scheduleColumnRemoval(playerIndex);
    this.#advanceTurn();

    return {
      playerIndex,
      position,
      newCard: {
        value: drawn.card.value,
        image: drawn.card.image,
      },
      discarded: {
        value: replacedCard.value,
        image: replacedCard.image,
      },
      phase: this.#phase,
      nextPlayerIndex: this.#activePlayerIndex,
    };
  }

  discardDrawnCardAndReveal(playerIndex, position) {
    this.#assertMainPlayPhase();
    this.#assertActivePlayer(playerIndex);
    this.#assertValidPosition(position);

    const drawn = this.#consumeDrawnCard(playerIndex);
    drawn.card.visible = true;
    this.#discardPile.push(drawn.card);

    const hand = this.#resolvePlayerHand(playerIndex);
    const revealed = hand.revealCard(position);

    this.#logger.info(
      `SkyjoEngine: player '${this.#players[playerIndex].name}' discarded drawn card ${drawn.card.value} and revealed position ${position} (${revealed.value})`
    );

    this.#scheduleColumnRemoval(playerIndex);
    this.#advanceTurn();

    return {
      playerIndex,
      position,
      revealed,
      discarded: {
        value: drawn.card.value,
        image: drawn.card.image,
      },
      phase: this.#phase,
      nextPlayerIndex: this.#activePlayerIndex,
    };
  }

  #pruneColumnRemovalEvents() {
    const cutoff = Date.now() - 5000;
    this.#recentColumnRemovalEvents = this.#recentColumnRemovalEvents.filter(
      (entry) => entry.timestamp >= cutoff
    );
  }

  #notifyStateChange() {
    this.#pruneColumnRemovalEvents();
    if (typeof this.#stateChangeHandler === "function") {
      this.#stateChangeHandler();
    }
  }

  #clearPendingColumnRemoval(playerIndex) {
    const pending = this.#pendingColumnRemovals.get(playerIndex);
    if (pending) {
      clearTimeout(pending.timeoutId);
      this.#pendingColumnRemovals.delete(playerIndex);
    }
    this.#pruneColumnRemovalEvents();
  }

  #findMatchingColumns(playerIndex) {
    const hand = this.#resolvePlayerHand(playerIndex);
    const matrix = hand.cardsMatrix();
    const columnCount = hand.columns;
    const rowCount = matrix.length;

    if (columnCount <= 0 || rowCount === 0) {
      return [];
    }

    const matches = [];

    for (let column = 0; column < columnCount; column += 1) {
      let referenceValue = null;
      let isMatch = true;

      for (let row = 0; row < rowCount; row += 1) {
        const rowCards = matrix[row] ?? [];
        const card = rowCards[column];
        if (!card) {
          isMatch = false;
          break;
        }
        if (card.value === "X") {
          isMatch = false;
          break;
        }
        if (referenceValue === null) {
          referenceValue = card.value;
        } else if (card.value !== referenceValue) {
          isMatch = false;
          break;
        }
      }

      if (isMatch && referenceValue !== null) {
        matches.push({
          columnIndex: column,
          value: referenceValue,
        });
      }
    }

    return matches;
  }

  #scheduleColumnRemoval(playerIndex) {
    const matches = this.#findMatchingColumns(playerIndex);
    if (matches.length === 0) {
      this.#clearPendingColumnRemoval(playerIndex);
      return;
    }

    const existing = this.#pendingColumnRemovals.get(playerIndex);
    if (existing) {
      clearTimeout(existing.timeoutId);
    }

    const expiresAt = Date.now() + COLUMN_REMOVAL_DELAY_MS;
    const timeoutId = setTimeout(() => {
      this.#executePendingColumnRemoval(playerIndex);
    }, COLUMN_REMOVAL_DELAY_MS);

    this.#pendingColumnRemovals.set(playerIndex, {
      matches,
      startedAt: Date.now(),
      expiresAt,
      timeoutId,
    });
  }

  #executePendingColumnRemoval(playerIndex) {
    const pending = this.#pendingColumnRemovals.get(playerIndex);
    if (!pending) {
      return;
    }
    clearTimeout(pending.timeoutId);
    this.#pendingColumnRemovals.delete(playerIndex);

    const matches = this.#findMatchingColumns(playerIndex);
    if (matches.length === 0) {
      this.#notifyStateChange();
      return;
    }

    const hand = this.#resolvePlayerHand(playerIndex);
    const matchesDescending = [...matches].sort(
      (a, b) => b.columnIndex - a.columnIndex
    );
    const matchesAscending = [...matches].sort(
      (a, b) => a.columnIndex - b.columnIndex
    );

    matchesDescending.forEach(({ columnIndex }) => {
      hand.removeColumn(columnIndex);
    });

    const removedColumns = matchesAscending.map((match) => match.columnIndex);
    const removedValues = matchesAscending.map((match) => match.value);

    const playerName =
      this.#players[playerIndex]?.name ?? `Player ${playerIndex + 1}`;
    const timestamp = Date.now();
    const eventId = `${timestamp}-${playerIndex}-${removedColumns.join("-")}`;
    this.#logger.info(
      `SkyjoEngine: removed column(s) ${removedColumns
        .map(
          (index, idx) =>
            `${index + 1}${
              removedValues[idx] !== undefined
                ? ` (value ${removedValues[idx]})`
                : ""
            }`
        )
        .join(", ")} for player '${playerName}'`
    );

    if (typeof this.#columnRemovalHandler === "function") {
      this.#columnRemovalHandler({
        playerIndex,
        playerName,
        columns: removedColumns,
        values: removedValues,
        timestamp,
        id: eventId,
      });
    }

    this.#recentColumnRemovalEvents.push({
      id: eventId,
      playerIndex,
      playerName,
      columns: removedColumns,
      values: removedValues,
      timestamp,
    });
    this.#pruneColumnRemovalEvents();

    // Check again in case new columns were formed after removal.
    this.#scheduleColumnRemoval(playerIndex);
    this.#notifyStateChange();
  }

  revealInitialCard(playerIndex, position) {
    this.#assertPhase(SkyjoPhases.INITIAL_FLIP);
    const hand = this.#resolvePlayerHand(playerIndex);

    const selections =
      this.#initialFlipSelections.get(playerIndex) ?? new Set();
    if (selections.has(position)) {
      throw new Error(
        "Cannot reveal the same card twice during the initial flip phase"
      );
    }

    if (selections.size >= INITIAL_FLIP_REVEALS) {
      throw new Error("Player has already revealed the required initial cards");
    }

    const revealed = hand.revealCard(position);
    selections.add(position);
    this.#initialFlipSelections.set(playerIndex, selections);

    const previousTotal = this.#initialFlipTotals.get(playerIndex) ?? 0;
    this.#initialFlipTotals.set(playerIndex, previousTotal + revealed.value);

    this.#logger.info(
      `SkyjoEngine: player '${this.#players[playerIndex].name}' revealed card at position ${position} with value ${revealed.value}`
    );

    if (this.#allPlayersCompletedInitialFlip()) {
      this.#resolveInitialTurnOrder();
    }

    return {
      playerIndex,
      position,
      card: revealed,
      phase: this.#phase,
      activePlayerIndex: this.#activePlayerIndex,
    };
  }

  buildStateSnapshot() {
    const activePlayer = this.activePlayer;
    return {
      phase: this.#phase,
      activePlayerIndex: this.#activePlayerIndex,
      activePlayer: activePlayer
        ? {
            name: activePlayer.name,
            color: activePlayer.color,
          }
        : null,
      initialFlip: {
        requiredReveals: INITIAL_FLIP_REVEALS,
        players: this.#players.map((player, index) => ({
          name: player.name,
          color: player.color,
          flippedPositions: Array.from(
            this.#initialFlipSelections.get(index) ?? new Set()
          ),
          total: this.#initialFlipTotals.get(index) ?? 0,
          completed: this.#hasPlayerCompletedInitialFlip(index),
        })),
        resolved: this.#phase !== SkyjoPhases.INITIAL_FLIP,
      },
      discard: {
        size: this.#discardPile.length,
        topCard: this.discardTopCard(),
      },
      drawnCard: this.#drawnCard
        ? {
            source: this.#drawnCard.source,
            playerIndex: this.#drawnCard.playerIndex,
            playerName:
              this.#players[this.#drawnCard.playerIndex]?.name ?? null,
            value: this.#drawnCard.card.value,
            image: this.#drawnCard.card.image,
            visible: this.#drawnCard.card.value !== "X",
          }
        : null,
      finalRound: {
        inProgress:
          this.#phase === SkyjoPhases.FINAL_ROUND ||
          this.#phase === SkyjoPhases.FINISHED,
        triggeredBy: this.#finalRoundTrigger,
        pendingTurns: [...this.#finalRoundQueue],
      },
      pendingColumnRemovals: Array.from(
        this.#pendingColumnRemovals.entries()
      ).map(([playerIndex, pending]) => ({
        playerIndex,
        playerName: this.#players[playerIndex]?.name ?? null,
        columns: pending.matches.map((match) => match.columnIndex),
        values: pending.matches.map((match) => match.value),
        expiresAt: pending.expiresAt,
        startedAt: pending.startedAt,
      })),
      recentColumnRemovalEvents: this.#recentColumnRemovalEvents.map(
        (entry) => ({
          id: entry.id,
          playerIndex: entry.playerIndex,
          playerName: entry.playerName,
          columns: [...entry.columns],
          values: [...entry.values],
          timestamp: entry.timestamp,
        })
      ),
    };
  }

  buildDeckSnapshot() {
    return {
      size: this.#dealer.deck.size(),
      topCard: this.discardTopCard(),
      discardSize: this.#discardPile.length,
    };
  }

  discardTopCard() {
    if (this.#discardPile.length === 0) {
      return null;
    }

    const topCard = this.#discardPile[this.#discardPile.length - 1];
    return {
      value: topCard.value,
      image: topCard.image,
      visible: topCard.value !== "X",
    };
  }

  // -- internal helpers ----------------------------------------------------

  #resolvePlayerHand(playerIndex) {
    if (!Number.isInteger(playerIndex)) {
      throw new TypeError("Player index must be an integer");
    }

    if (playerIndex < 0 || playerIndex >= this.#players.length) {
      throw new RangeError("Player index out of bounds");
    }

    return this.#players[playerIndex].hand;
  }

  #initializeDiscardPile() {
    if (!this.#dealer || !this.#dealer.deck) {
      return;
    }

    if (this.#dealer.deck.size() === 0) {
      return;
    }

    const card = this.#dealer.deck.dealNextCard();
    card.visible = true;
    this.#discardPile.push(card);
    this.#logger.info(
      `SkyjoEngine: initialized discard pile with card value ${card.value}`
    );
  }

  #assertMainPlayPhase() {
    if (
      this.#phase !== SkyjoPhases.MAIN_PLAY &&
      this.#phase !== SkyjoPhases.FINAL_ROUND
    ) {
      throw new Error(
        `Main play action attempted outside main phases (current: '${this.#phase}')`
      );
    }
  }

  #assertActivePlayer(playerIndex) {
    if (this.#activePlayerIndex !== playerIndex) {
      throw new Error("It is not this player's turn");
    }
  }

  #assertNoPendingDraw() {
    if (this.#drawnCard) {
      throw new Error("Player must resolve the previously drawn card first");
    }
  }

  #consumeDrawnCard(playerIndex) {
    if (!this.#drawnCard) {
      throw new Error("Player must draw a card before taking an action");
    }

    if (this.#drawnCard.playerIndex !== playerIndex) {
      throw new Error("Drawn card belongs to a different player");
    }

    const drawn = this.#drawnCard;
    this.#drawnCard = null;
    return drawn;
  }

  #assertValidPosition(position) {
    if (!Number.isInteger(position)) {
      throw new TypeError("Hand position must be an integer");
    }
  }

  #advanceTurn() {
    if (this.#turnOrder.length === 0) {
      this.#activePlayerIndex = null;
      return;
    }

    this.#turnCursor = (this.#turnCursor + 1) % this.#turnOrder.length;
    this.#activePlayerIndex = this.#turnOrder[this.#turnCursor];
  }

  #allPlayersCompletedInitialFlip() {
    return this.#players.every((_player, index) =>
      this.#hasPlayerCompletedInitialFlip(index)
    );
  }

  #hasPlayerCompletedInitialFlip(index) {
    const selections = this.#initialFlipSelections.get(index);
    return selections ? selections.size >= INITIAL_FLIP_REVEALS : false;
  }

  #resolveInitialTurnOrder() {
    let highestTotal = -Infinity;
    let winnerIndex = 0;

    this.#players.forEach((_player, index) => {
      const total = this.#initialFlipTotals.get(index) ?? 0;

      if (total > highestTotal) {
        highestTotal = total;
        winnerIndex = index;
        return;
      }

      if (total === highestTotal) {
        const currentWinnerTurnOrder = this.#turnOrder.indexOf(winnerIndex);
        const contenderTurnOrder = this.#turnOrder.indexOf(index);

        if (contenderTurnOrder < currentWinnerTurnOrder) {
          winnerIndex = index;
        }
      }
    });

    this.#phase = SkyjoPhases.MAIN_PLAY;
    this.#activePlayerIndex = winnerIndex;
    this.#turnCursor = this.#turnOrder.indexOf(winnerIndex);

    const winnerName = this.#players[winnerIndex]?.name ?? "unknown";
    this.#logger.info(
      `SkyjoEngine: initial flip resolved; '${winnerName}' will start the main phase`
    );
  }

  #assertPhase(expected) {
    if (this.#phase !== expected) {
      throw new Error(
        `Action expected during phase '${expected}' but current phase is '${this.#phase}'`
      );
    }
  }

  static #validateGame(game) {
    if (!game || typeof game !== "object") {
      throw new TypeError("SkyjoEngine requires a valid game definition");
    }
    return game;
  }

  static #validateDealer(dealer) {
    if (!dealer || typeof dealer !== "object") {
      throw new TypeError("SkyjoEngine requires a dealer instance");
    }
    if (!dealer.deck || typeof dealer.deck.size !== "function") {
      throw new TypeError("SkyjoEngine requires the dealer to expose a deck");
    }
    if (typeof dealer.players === "undefined") {
      throw new TypeError("SkyjoEngine requires the dealer to expose players");
    }
    return dealer;
  }

  static #validatePlayers(players) {
    if (!Array.isArray(players) || players.length === 0) {
      throw new TypeError("SkyjoEngine requires at least one player");
    }
    return players;
  }
}
