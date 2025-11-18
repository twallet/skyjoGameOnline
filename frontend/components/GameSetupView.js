import React from "https://esm.sh/react@18?dev";
import { GameSession } from "../../shared/models/gameSession.js";

/**
 * Renders the game setup view for Skyjo, allowing players to create or join rooms,
 * enter their name, and start the game when ready.
 *
 * @param {Object} props - Component props
 * @param {boolean} props.isProcessing - Whether the component is processing an async operation
 * @param {string} props.roomId - The current room ID (if joined/created or from URL)
 * @param {boolean} props.gameStarted - Whether the game has already started
 * @param {string} props.playerName - The current player's name input
 * @param {string[]} props.playerNames - List of all player names in the room
 * @param {string[]} props.playerColors - Array of color codes for player display
 * @param {Function} props.onPlayerNameChange - Callback when player name input changes
 * @param {Function} props.onJoinRoom - Callback to join an existing room
 * @param {Function} props.onCreateRoom - Callback to create a new room
 * @param {Function} props.onStartGame - Callback to start the game
 * @param {boolean} props.canStartGame - Whether the game can be started
 * @param {string} props.errorMessage - Error message to display (if any)
 * @param {boolean} props.isPlayerNameValid - Whether the player name is valid
 * @param {boolean} props.isJoiningRoom - Whether the user is in the join room flow
 * @param {boolean} props.hasCreatedRoom - Whether the user has created a room
 * @param {Function} props.onCopyRoomId - Callback to copy the room ID
 * @returns {React.ReactElement} The rendered setup view component
 */
export function GameSetupView({
  isProcessing,
  roomId,
  gameStarted,
  playerName,
  playerNames,
  playerColors,
  onPlayerNameChange,
  onJoinRoom,
  onCreateRoom,
  onStartGame,
  canStartGame,
  errorMessage,
  isPlayerNameValid,
  isJoiningRoom,
  hasCreatedRoom,
  onCopyRoomId,
}) {
  // Get trimmed room ID for validation purposes
  const trimmedRoomId = typeof roomId === "string" ? roomId.trim() : "";

  // Determine if join button should be disabled
  const joinDisabled =
    isProcessing ||
    !isPlayerNameValid ||
    (isJoiningRoom && trimmedRoomId.length === 0);

  // Determine if create button should be disabled
  const createDisabled = isProcessing || !isPlayerNameValid;

  // Determine if start button should be disabled
  const startDisabled = isProcessing || !canStartGame || gameStarted;

  // Show room info banner when room is selected and not in joining flow
  const shouldShowRoomInfo = !isJoiningRoom && Boolean(roomId);

  // Show inline start button in player list when game can start and not joining
  const showInlineStart = canStartGame && !isJoiningRoom;

  // Show copy button in room banner when not in joining flow
  const showRoomBannerCopy = !isJoiningRoom;

  // Show join actions (room input + join button) when in joining flow
  const showJoinActions = isJoiningRoom;

  // Show create actions (new room button) when appropriate
  const showCreateActions =
    !isJoiningRoom && !hasCreatedRoom && isPlayerNameValid;

  return React.createElement(
    "main",
    { className: "app-container setup-container" },
    React.createElement(
      "section",
      { className: "setup__panel" },
      // Hero image
      React.createElement("img", {
        src: "./assets/images/box.png",
        alt: "Skyjo game box",
        className: "setup__hero",
      }),
      // Player name input - shown when room not created, not processing, and user hasn't joined yet
      // Hide when: room created, processing, or (players exist and not in joining flow)
      hasCreatedRoom ||
        isProcessing ||
        (playerNames.length > 0 && !isJoiningRoom)
        ? null
        : React.createElement("input", {
            id: "player-name-input",
            className: "setup__player-input",
            type: "text",
            placeholder: "Your Name",
            autoFocus: true,
            maxLength: 15,
            value: playerName,
            onChange: (event) => onPlayerNameChange(event.target.value),
            // Prevent typing when at max length (unless replacing selected text)
            onKeyDown: (event) => {
              const isCharacterKey =
                event.key.length === 1 &&
                !event.ctrlKey &&
                !event.metaKey &&
                !event.altKey;
              const noSelection =
                event.currentTarget.selectionStart ===
                event.currentTarget.selectionEnd;
              if (
                isCharacterKey &&
                noSelection &&
                playerName.length >= GameSession.MAX_PLAYER_NAME_LENGTH
              ) {
                event.preventDefault();
              }
            },
            disabled: isProcessing,
          }),
      // Join actions: room banner + join button (shown when joining)
      showJoinActions
        ? React.createElement(
            "div",
            { className: "setup__actions setup__actions--joining" },
            // Show read-only room banner
            React.createElement(
              "div",
              {
                className: "setup__room-banner setup__room-banner--inline",
              },
              React.createElement(
                "div",
                { className: "setup__current-room" },
                React.createElement(
                  "span",
                  { className: "setup__current-room-label" },
                  "Room"
                ),
                React.createElement(
                  "span",
                  { className: "setup__current-room-value" },
                  roomId
                )
              )
            ),
            // Join button
            React.createElement(
              "button",
              {
                type: "button",
                className: "setup__button-join-room",
                onClick: onJoinRoom,
                disabled: joinDisabled,
              },
              "Join"
            )
          )
        : // Create actions: new room button (shown when not joining and room not locked)
          showCreateActions
          ? React.createElement(
              "div",
              { className: "setup__actions" },
              // New room button
              React.createElement(
                "button",
                {
                  type: "button",
                  className: "setup__button-new-room",
                  onClick: onCreateRoom,
                  disabled: createDisabled,
                },
                "New room"
              )
            )
          : null,
      // Room info banner (shown when room is selected and locked)
      shouldShowRoomInfo
        ? React.createElement(
            "div",
            { className: "setup__room-banner" },
            React.createElement(
              "div",
              { className: "setup__current-room" },
              React.createElement(
                "span",
                { className: "setup__current-room-label" },
                "Room"
              ),
              React.createElement(
                "span",
                { className: "setup__current-room-value" },
                roomId
              ),
              // Copy button for room ID
              showRoomBannerCopy
                ? React.createElement(
                    "button",
                    {
                      type: "button",
                      className: "setup__copy-button",
                      onClick: onCopyRoomId,
                      disabled: isProcessing || !roomId,
                      title: "Copy join link",
                    },
                    "📋"
                  )
                : null
            )
          )
        : null,
      // Players list (shown when there are players)
      playerNames.length > 0
        ? React.createElement(
            "div",
            { className: "setup__players-row" },
            React.createElement(
              "span",
              { className: "setup__current-room-label" },
              "Players"
            ),
            React.createElement(
              "ul",
              { className: "setup__players" },
              // Render each player with their assigned color
              playerNames.map((name, index) =>
                React.createElement(
                  "li",
                  {
                    key: name,
                    className: "setup__player",
                    style: {
                      backgroundColor:
                        playerColors[index % playerColors.length],
                    },
                  },
                  name
                )
              ),
              // Inline start button (shown when game can start and not joining)
              showInlineStart
                ? React.createElement(
                    "li",
                    { className: "setup__player setup__player--start" },
                    React.createElement(
                      "button",
                      {
                        type: "button",
                        className:
                          "setup__start-button setup__start-button--inline",
                        onClick: onStartGame,
                        disabled: startDisabled,
                      },
                      "Play"
                    )
                  )
                : null
            )
          )
        : null
    ),
    // Error message display
    errorMessage
      ? React.createElement(
          "p",
          { className: "error", role: "alert" },
          errorMessage
        )
      : null
  );
}
