import { resolveLogger, noopLogger } from "../utils/logger.js";

export const SkyjoPhases = Object.freeze({
  INITIAL_FLIP: "initial-flip",
  MAIN_PLAY: "main-play",
  FINAL_ROUND: "final-round",
  FINISHED: "finished",
});

const INITIAL_FLIP_REVEALS = 2;

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

  constructor(game, dealer, players, logger = noopLogger) {
    this.#game = SkyjoEngine.#validateGame(game);
    this.#dealer = SkyjoEngine.#validateDealer(dealer);
    this.#players = SkyjoEngine.#validatePlayers(players);
    this.#logger = resolveLogger(logger);

    this.#turnOrder = this.#players.map((_, index) => index);
    this.#turnCursor = 0;
    this.#initializeDiscardPile();
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
