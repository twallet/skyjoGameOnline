import { resolveLogger, noopLogger } from "../logger.js";
import { Dealer } from "./dealer.js";
import { Player } from "./player.js";
import { SkyjoEngine, SkyjoPhases } from "./skyjoEngine.js";

/**
 * Wraps the core game flow so the UI can interact through a stable API.
 */
export class GameSession {
  #game;
  #dealer = null;
  #players = [];
  #logEntries = [];
  #deckSnapshot = null;
  #engine = null;
  #mainPhaseAnnounced = false;
  #lastSnapshot = null;
  static #MAX_PLAYER_NAME_LENGTH = 15;
  #logger;
  #finalRoundTriggeredBy = null;
  #finalScoresLogged = false;

  #ensureGameStarted() {
    if (!this.#engine) {
      throw new Error("Game has not started yet.");
    }
  }

  #resolvePlayer(playerName) {
    if (typeof playerName !== "string" || playerName.trim() === "") {
      throw new TypeError("Player name must be a non-empty string");
    }

    const trimmedName = playerName.trim();
    const playerIndex = this.#players.findIndex(
      (player) => player.name === trimmedName
    );

    if (playerIndex === -1) {
      throw new Error(`Unknown player: ${trimmedName}`);
    }

    return { name: trimmedName, index: playerIndex };
  }

  #normalizePosition(position) {
    if (!Number.isInteger(position)) {
      throw new TypeError("Card position must be an integer");
    }
    return position;
  }

  #appendLog(message, options = {}) {
    if (!message) {
      return;
    }

    const phaseFallback =
      this.#engine && this.#engine.phase
        ? this.#engine.phase
        : SkyjoPhases.PREPARATION;
    const phase =
      typeof options.phase === "string" && options.phase.length
        ? options.phase
        : phaseFallback;
    const actor =
      typeof options.actor === "string" && options.actor.trim().length
        ? options.actor.trim()
        : null;

    this.#logEntries = [
      ...this.#logEntries,
      {
        message,
        phase,
        actor,
      },
    ];
  }

  #updateSnapshots() {
    const snapshot = this.#buildSessionSnapshot();
    this.#deckSnapshot = snapshot.deck;
    this.#lastSnapshot = GameSession.#cloneSnapshot(snapshot);
    return this.#lastSnapshot;
  }

  #buildActionResponse(event) {
    const latestSnapshot = this.#updateSnapshots();
    if (
      latestSnapshot.state?.phase === SkyjoPhases.FINISHED &&
      !this.#finalScoresLogged
    ) {
      this.#finalScoresLogged = true;
      this.#logFinalScores(latestSnapshot.state);
    }
    return {
      event,
      snapshot: GameSession.#cloneSnapshot(latestSnapshot),
      logEntries: this.#logEntries.map(GameSession.#cloneLogEntry),
      deck: {
        size: latestSnapshot.deck.size,
        topCard: latestSnapshot.deck.topCard
          ? { ...latestSnapshot.deck.topCard }
          : null,
        discardSize: latestSnapshot.deck.discardSize ?? 0,
      },
    };
  }

  constructor(game, logger = noopLogger) {
    this.#game = GameSession.#validateGame(game);
    this.#logger = resolveLogger(logger);
    this.#finalRoundTriggeredBy = null;
    this.#finalScoresLogged = false;
  }

  /**
   * Start a new session with the provided player names and optional colors.
   * @param {string[]} playerNames
   * @param {string[]} playerColors
   * @returns {{
   *   players: Array<{
   *     name: string,
   *     color: string | null,
   *     hand: {
   *       size: number,
   *       lines: number,
   *       matrix: Array<Array<{ value: string | number, image: string }>>
   *     }
   *   }>,
   *   logEntries: Array<{
   *     message: string,
   *     phase: string | null,
   *     actor: string | null
   *   }>,
   *   deck: { size: number, topCard: { value: string | number, image: string, visible: boolean } | null, discardSize: number },
   *   state: ReturnType<import("./skyjoEngine.js").SkyjoEngine["buildStateSnapshot"]> | null
   * }}
   */
  start(playerNames, playerColors = []) {
    this.#finalRoundTriggeredBy = null;
    this.#finalScoresLogged = false;
    const names = GameSession.#validatePlayerNames(
      playerNames,
      this.#game.minPlayers,
      this.#game.maxPlayers
    );

    this.#players = names.map((name, index) => {
      const color =
        playerColors.length > 0
          ? playerColors[index % playerColors.length]
          : null;
      return new Player(name, this.#game, color ?? undefined);
    });

    this.#mainPhaseAnnounced = false;
    this.#logger.info(
      `GameSession: starting ${this.#game.name} for players ${this.#players
        .map((player) => player.name)
        .join(", ")}`
    );

    this.#dealer = new Dealer(this.#game, this.#players);
    this.#dealer.shuffle();
    this.#dealer.deal();
    this.#engine = new SkyjoEngine(
      this.#game,
      this.#dealer,
      this.#players,
      this.#logger,
      {
        onStateChange: () => {
          this.#updateSnapshots();
        },
        onColumnsRemoved: ({ playerIndex, columns, values, playerName }) => {
          if (Array.isArray(columns) && columns.length > 0) {
            const name =
              playerName ?? this.#players[playerIndex]?.name ?? "Unknown";
            const columnLabels = columns
              .map((columnIndex, idx) => {
                const value =
                  Array.isArray(values) && values.length > idx
                    ? values[idx]
                    : undefined;
                return value !== undefined
                  ? `${columnIndex + 1} (value ${value})`
                  : `${columnIndex + 1}`;
              })
              .join(", ");
            this.#appendLog(`${name} cleared column ${columnLabels}`, {
              phase: this.#engine?.phase ?? null,
              actor: name,
            });
          }
        },
      }
    );

    this.#logger.info(
      `GameSession: dealer prepared deck with ${this.#dealer.deck.size()} cards`
    );

    this.#logEntries = GameSession.#buildInitialLog(
      this.#game,
      this.#dealer,
      this.#players,
      this.#engine?.phase ?? SkyjoPhases.PREPARATION
    );
    const snapshot = this.#buildSessionSnapshot();
    this.#deckSnapshot = snapshot.deck;
    this.#lastSnapshot = GameSession.#cloneSnapshot(snapshot);

    return GameSession.#cloneSnapshot(snapshot);
  }

  get dealer() {
    return this.#dealer;
  }

  get players() {
    return [...this.#players];
  }

  get logEntries() {
    return this.#logEntries.map(GameSession.#cloneLogEntry);
  }

  get deckSnapshot() {
    if (!this.#deckSnapshot) {
      return { size: 0, topCard: null };
    }
    return {
      size: this.#deckSnapshot.size,
      topCard: this.#deckSnapshot.topCard
        ? { ...this.#deckSnapshot.topCard }
        : null,
      discardSize: this.#deckSnapshot.discardSize ?? 0,
    };
  }

  getSnapshot() {
    if (!this.#lastSnapshot) {
      return null;
    }

    return GameSession.#cloneSnapshot(this.#lastSnapshot);
  }

  revealInitialCard(playerName, position) {
    this.#ensureGameStarted();
    const { name, index } = this.#resolvePlayer(playerName);
    const normalizedPosition = this.#normalizePosition(position);

    const result = this.#engine.revealInitialCard(index, normalizedPosition);

    this.#appendLog(`${name} revealed ${result.card.value}`, {
      phase: result.phase ?? null,
      actor: name,
    });

    if (
      result.phase === SkyjoPhases.PLAYING &&
      !this.#mainPhaseAnnounced &&
      result.activePlayerIndex !== null
    ) {
      const starterIndex = result.activePlayerIndex;
      const starterName = this.#players[starterIndex]?.name ?? "Unknown";
      const stateSnapshot = this.#engine.buildStateSnapshot();
      const starterInfo =
        stateSnapshot?.initialFlip?.players?.[starterIndex] ?? null;
      const starterTotal =
        typeof starterInfo?.total === "number" ? starterInfo.total : null;

      if (starterTotal !== null) {
        this.#appendLog(
          `${starterName} has the highest value: ${starterTotal}.`,
          {
            phase: SkyjoPhases.PLAYING,
            actor: starterName,
          }
        );
      } else {
        this.#appendLog(`${starterName} has the highest value.`, {
          phase: SkyjoPhases.PLAYING,
          actor: starterName,
        });
      }
      this.#appendLog(`${starterName} starts the round.`, {
        phase: SkyjoPhases.PLAYING,
        actor: starterName,
      });
      this.#mainPhaseAnnounced = true;
    }

    return this.#buildActionResponse({
      ...result,
      playerName: name,
      type: "initial-flip",
    });
  }

  drawCard(playerName, source) {
    this.#ensureGameStarted();
    const normalizedSource = source === "discard" ? "discard" : "deck";
    const { name, index } = this.#resolvePlayer(playerName);

    const result =
      normalizedSource === "discard"
        ? this.#engine.drawFromDiscard(index)
        : this.#engine.drawFromDeck(index);

    if (normalizedSource === "discard") {
      this.#appendLog(`${name} took discard card ${result.card.value}`, {
        phase: result.phase ?? null,
        actor: name,
      });
    } else {
      this.#appendLog(`${name} drew ${result.card.value} from the deck`, {
        phase: result.phase ?? null,
        actor: name,
      });
    }

    return this.#buildActionResponse({
      ...result,
      playerName: name,
      type: "draw",
    });
  }

  replaceWithDrawnCard(playerName, position) {
    this.#ensureGameStarted();
    const { name, index } = this.#resolvePlayer(playerName);
    const normalizedPosition = this.#normalizePosition(position);

    const result = this.#engine.replaceWithDrawnCard(index, normalizedPosition);

    this.#appendLog(
      `${name} replaced position ${normalizedPosition} with ${result.newCard.value}, discarding ${result.discarded.value}`,
      {
        phase: result.phase ?? null,
        actor: name,
      }
    );
    if (result.handCompleted) {
      this.#handleHandCompletion(name, index);
    }

    return this.#buildActionResponse({
      ...result,
      playerName: name,
      type: "replace",
    });
  }

  discardDrawnCardAndReveal(playerName, position) {
    this.#ensureGameStarted();
    const { name, index } = this.#resolvePlayer(playerName);
    const normalizedPosition = this.#normalizePosition(position);

    const result = this.#engine.discardDrawnCardAndReveal(
      index,
      normalizedPosition
    );

    this.#appendLog(
      `${name} discarded ${result.discarded.value} and revealed ${result.revealed.value} at position ${normalizedPosition}`,
      {
        phase: result.phase ?? null,
        actor: name,
      }
    );
    if (result.handCompleted) {
      this.#handleHandCompletion(name, index);
    }

    return this.#buildActionResponse({
      ...result,
      playerName: name,
      type: "reveal",
    });
  }

  #handleHandCompletion(playerName, playerIndex) {
    if (this.#finalRoundTriggeredBy) {
      return;
    }
    this.#finalRoundTriggeredBy = playerName;
    const playerTotal = this.#calculateHandTotal(
      this.#players[playerIndex]?.hand
    );
    if (playerTotal !== null) {
      this.#appendLog(
        `${playerName} revealed all cards and triggered the final round with ${playerTotal} points.`,
        {
          phase: SkyjoPhases.FINAL_ROUND,
          actor: playerName,
        }
      );
    }
  }

  #calculateHandTotal(hand) {
    if (!hand || typeof hand.cards !== "function") {
      return null;
    }
    const values = hand.cards();
    if (!Array.isArray(values) || values.length === 0) {
      return 0;
    }
    return values.reduce((total, value) => {
      if (typeof value === "number" && Number.isFinite(value)) {
        return total + value;
      }
      return total;
    }, 0);
  }

  #logFinalScores(state) {
    const finalRound = state?.finalRound;
    if (!finalRound || !Array.isArray(finalRound.scores)) {
      return;
    }

    finalRound.scores.forEach(({ name, total, doubled }) => {
      if (!name) {
        return;
      }
      const suffix = doubled ? " (sum doubled)" : "";
      this.#appendLog(`${name}'s cards sum to ${total}${suffix}.`, {
        phase: SkyjoPhases.FINISHED,
        actor: name,
      });
    });

    const winnerName =
      finalRound.winner ??
      finalRound.scores.reduce((best, entry) =>
        entry.total < best.total ? entry : best
      ).name;
    if (winnerName) {
      const winnerScore =
        finalRound.scores.find((entry) => entry.name === winnerName)?.total ??
        null;
      const scoreText =
        winnerScore !== null ? ` with ${winnerScore} points` : "";
      this.#appendLog(`${winnerName} wins${scoreText}.`, {
        phase: SkyjoPhases.FINISHED,
        actor: winnerName,
      });
    }
    // TEMPORARY
    this.#logger.info("Final logs", finalRound.scores);
  }

  reset() {
    this.#dealer = null;
    this.#players = [];
    this.#logEntries = [];
    this.#deckSnapshot = null;
    this.#engine = null;
    this.#lastSnapshot = null;
    this.#mainPhaseAnnounced = false;
    this.#logger.info("GameSession: reset complete");
    this.#finalRoundTriggeredBy = null;
    this.#finalScoresLogged = false;
  }

  /**
   * Validate and return an updated list of player names including the new one.
   * @param {string[]} currentNames
   * @param {string} rawName
   * @returns {string[]}
   */
  addPlayer(currentNames, rawName) {
    if (!Array.isArray(currentNames)) {
      throw new TypeError("Current player names must be provided as an array");
    }

    if (currentNames.length >= this.#game.maxPlayers) {
      throw new Error(
        `You cannot add more than ${this.#game.maxPlayers} players to the game.`
      );
    }

    const trimmed = GameSession.#validatePlayerName(rawName);

    if (currentNames.includes(trimmed)) {
      throw new Error("Player name must be unique.");
    }

    return [...currentNames, trimmed];
  }

  /**
   * Determine if the game can start with the provided player count.
   * @param {number} playerCount
   * @returns {boolean}
   */
  canStartGame(playerCount) {
    return (
      Number.isInteger(playerCount) && playerCount >= this.#game.minPlayers
    );
  }

  /**
   * Determine if more players can join given the current count.
   * @param {number} playerCount
   * @returns {boolean}
   */
  canAddPlayer(playerCount) {
    return Number.isInteger(playerCount) && playerCount < this.#game.maxPlayers;
  }

  static #validateGame(game) {
    if (!game || typeof game !== "object") {
      throw new TypeError("GameSession requires a game definition object");
    }

    if (
      typeof game.minPlayers !== "number" ||
      typeof game.maxPlayers !== "number"
    ) {
      throw new TypeError(
        "GameSession requires the game to define minPlayers and maxPlayers"
      );
    }

    return game;
  }

  static #validatePlayerNames(names, minPlayers, maxPlayers) {
    if (!Array.isArray(names)) {
      throw new TypeError("Player names must be provided as an array");
    }

    const trimmed = names.map((name, index) =>
      GameSession.#validatePlayerName(name, index)
    );

    if (trimmed.length < minPlayers) {
      throw new Error(
        `You must provide at least ${minPlayers} players to start the game`
      );
    }

    if (trimmed.length > maxPlayers) {
      throw new Error(
        `You cannot provide more than ${maxPlayers} players for this game`
      );
    }

    return trimmed;
  }

  static #validatePlayerName(name, index = null) {
    if (typeof name !== "string") {
      const label =
        index === null ? "Player name" : `Player name at index ${index}`;
      throw new TypeError(`${label} must be a string`);
    }

    const cleaned = name.trim();
    if (!cleaned) {
      const label =
        index === null ? "Player name" : `Player name at index ${index}`;
      throw new TypeError(`${label} must not be empty`);
    }

    if (cleaned.length > GameSession.#MAX_PLAYER_NAME_LENGTH) {
      throw new Error(
        `Player name must not exceed ${GameSession.#MAX_PLAYER_NAME_LENGTH} characters.`
      );
    }

    return cleaned;
  }

  static #cloneLogEntry(entry) {
    if (!entry || typeof entry !== "object") {
      const message =
        entry === undefined || entry === null ? "" : String(entry);
      return {
        message,
        phase: SkyjoPhases.PREPARATION,
        actor: null,
      };
    }

    const messageRaw =
      typeof entry.message === "string"
        ? entry.message
        : String(entry.message ?? "");
    const message = /[.!?]$/.test(messageRaw) ? messageRaw : `${messageRaw}.`;
    const phase =
      typeof entry.phase === "string" && entry.phase.length
        ? entry.phase
        : SkyjoPhases.PREPARATION;
    const actor =
      typeof entry.actor === "string" && entry.actor.trim().length
        ? entry.actor.trim()
        : null;

    return { message, phase, actor };
  }

  static #buildInitialLog(
    game,
    dealer,
    players,
    phase = SkyjoPhases.PREPARATION
  ) {
    return [
      {
        message: "Skyjo game started.",
        phase,
        actor: null,
      },
    ];
  }

  static #buildDeckSnapshot(deck) {
    if (!deck) {
      return { size: 0, topCard: null, discardSize: 0 };
    }

    const cards = deck.cardsDeck;
    const topCard = cards.length > 0 ? cards[cards.length - 1] : null;

    return {
      size: deck.size(),
      topCard: topCard
        ? {
            value: topCard.value,
            image: topCard.image,
            visible: topCard.value !== "X",
          }
        : null,
      discardSize: 0,
    };
  }

  #buildSessionSnapshot() {
    const players = this.#players.map((player) => ({
      name: player.name,
      color: player.color,
      hand: {
        size: player.hand.size,
        lines: player.hand.lines,
        matrix: player.hand
          .cardsMatrix()
          .map((row) => row.map((card) => ({ ...card }))),
      },
    }));

    const deck = this.#engine
      ? this.#engine.buildDeckSnapshot()
      : GameSession.#buildDeckSnapshot(this.#dealer?.deck ?? null);

    const state = this.#engine ? this.#engine.buildStateSnapshot() : null;

    return {
      players,
      logEntries: this.#logEntries.map(GameSession.#cloneLogEntry),
      deck,
      state: state ? GameSession.#cloneStateSnapshot(state) : null,
    };
  }

  static #cloneSnapshot(snapshot) {
    return {
      players: snapshot.players.map((player) => ({
        name: player.name,
        color: player.color,
        hand: {
          size: player.hand.size,
          lines: player.hand.lines,
          matrix: player.hand.matrix.map((row) =>
            row.map((card) => ({ ...card }))
          ),
        },
      })),
      logEntries: snapshot.logEntries.map(GameSession.#cloneLogEntry),
      deck: {
        size: snapshot.deck.size,
        topCard: snapshot.deck.topCard ? { ...snapshot.deck.topCard } : null,
        discardSize: snapshot.deck.discardSize ?? 0,
      },
      state: snapshot.state
        ? GameSession.#cloneStateSnapshot(snapshot.state)
        : null,
    };
  }

  static #cloneStateSnapshot(state) {
    return {
      phase: state.phase,
      activePlayerIndex: state.activePlayerIndex,
      activePlayer: state.activePlayer ? { ...state.activePlayer } : null,
      initialFlip: {
        requiredReveals: state.initialFlip.requiredReveals,
        resolved: state.initialFlip.resolved,
        players: state.initialFlip.players.map((player) => ({
          name: player.name,
          color: player.color,
          flippedPositions: [...player.flippedPositions],
          total: player.total,
          completed: player.completed,
        })),
      },
      discard: {
        size: state.discard.size,
        topCard: state.discard.topCard ? { ...state.discard.topCard } : null,
      },
      drawnCard: state.drawnCard ? { ...state.drawnCard } : null,
      finalRound: state.finalRound
        ? {
            inProgress: Boolean(state.finalRound.inProgress),
            triggeredBy: state.finalRound.triggeredBy ?? null,
            pendingTurns: Array.isArray(state.finalRound.pendingTurns)
              ? [...state.finalRound.pendingTurns]
              : [],
            completed: Boolean(state.finalRound.completed),
            scores: Array.isArray(state.finalRound.scores)
              ? state.finalRound.scores.map((entry) => ({ ...entry }))
              : [],
            doubled:
              typeof state.finalRound.doubled === "string" &&
              state.finalRound.doubled.trim().length
                ? state.finalRound.doubled.trim()
                : null,
          }
        : {
            inProgress: false,
            triggeredBy: null,
            pendingTurns: [],
            completed: false,
            scores: [],
            doubled: null,
          },
      pendingColumnRemovals: Array.isArray(state.pendingColumnRemovals)
        ? state.pendingColumnRemovals.map((entry) => ({
            playerIndex: entry.playerIndex ?? null,
            playerName: entry.playerName ?? null,
            columns: Array.isArray(entry.columns) ? [...entry.columns] : [],
            values: Array.isArray(entry.values) ? [...entry.values] : [],
            expiresAt:
              typeof entry.expiresAt === "number" ? entry.expiresAt : null,
            startedAt:
              typeof entry.startedAt === "number" ? entry.startedAt : null,
          }))
        : [],
      recentColumnRemovalEvents: Array.isArray(state.recentColumnRemovalEvents)
        ? state.recentColumnRemovalEvents.map((entry) => ({
            id: entry.id,
            playerIndex: entry.playerIndex,
            playerName: entry.playerName,
            columns: Array.isArray(entry.columns) ? [...entry.columns] : [],
            values: Array.isArray(entry.values) ? [...entry.values] : [],
            timestamp: entry.timestamp ?? null,
          }))
        : [],
    };
  }
}
