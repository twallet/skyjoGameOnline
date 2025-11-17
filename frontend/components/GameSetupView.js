import React from "https://esm.sh/react@18?dev";

/**
 * Renders the game setup view for Skyjo, allowing players to create or join rooms,
 * enter their name, and start the game when ready.
 *
 * @param {Object} props - Component props
 * @param {boolean} props.isLoading - Whether the component is in a loading state
 * @param {string} props.roomId - The current room ID (if joined/created)
 * @param {string} props.roomIdInput - The user's input for room ID
 * @param {boolean} props.gameStarted - Whether the game has already started
 * @param {string} props.playerName - The current player's name input
 * @param {string[]} props.playerNames - List of all player names in the room
 * @param {string[]} props.playerColors - Array of color codes for player display
 * @param {Function} props.onPlayerNameChange - Callback when player name input changes
 * @param {Function} props.onRoomIdInputChange - Callback when room ID input changes
 * @param {Function} props.onJoinRoom - Callback to join an existing room
 * @param {Function} props.onCreateRoom - Callback to create a new room
 * @param {Function} props.onStartGame - Callback to start the game
 * @param {boolean} props.canStartGame - Whether the game can be started
 * @param {string} props.errorMessage - Error message to display (if any)
 * @param {boolean} props.isPlayerNameValid - Whether the player name is valid
 * @param {boolean} props.isJoiningRoom - Whether the user is in the join room flow
 * @param {boolean} props.hasCreatedRoom - Whether the user has created a room
 * @param {boolean} props.isRoomSelectionLocked - Whether room selection is locked
 * @param {Function} props.onCopyRoomId - Callback to copy the room ID
 * @param {boolean} props.isRoomIdReadOnly - Whether the room ID input should be read-only
 * @param {boolean} [props.hasExistingRooms=true] - Whether there are existing rooms to join
 * @returns {React.ReactElement} The rendered setup view component
 */
export function GameSetupView({
  isLoading,
  roomId,
  roomIdInput,
  gameStarted,
  playerName,
  playerNames,
  playerColors,
  onPlayerNameChange,
  onRoomIdInputChange,
  onJoinRoom,
  onCreateRoom,
  onStartGame,
  canStartGame,
  errorMessage,
  isPlayerNameValid,
  isJoiningRoom,
  hasCreatedRoom,
  isRoomSelectionLocked,
  onCopyRoomId,
  isRoomIdReadOnly,
  hasExistingRooms = true,
}) {
  // Determine which room ID to display (prefer user input if provided, otherwise use current room ID)
  const displayedRoomId =
    typeof roomIdInput === "string" && roomIdInput.trim().length > 0
      ? roomIdInput.trim()
      : roomId;

  // Get trimmed room ID input for validation purposes
  const trimmedRoomId =
    typeof roomIdInput === "string" ? roomIdInput.trim() : "";

  // Determine if join button should be disabled
  const joinDisabled =
    isLoading ||
    !isPlayerNameValid ||
    (isJoiningRoom && trimmedRoomId.length === 0);

  // Determine if create button should be disabled
  const createDisabled = isLoading || !isPlayerNameValid;

  // Determine if start button should be disabled
  const startDisabled = isLoading || !canStartGame || gameStarted;

  // Show "Existing room" button when there are existing rooms and user hasn't created/joined yet
  const showJoinButton =
    hasExistingRooms &&
    !hasCreatedRoom &&
    !isRoomSelectionLocked &&
    !isJoiningRoom;

  // Show room info banner when room is selected and locked (not in joining flow)
  const shouldShowRoomInfo =
    !isJoiningRoom && isRoomSelectionLocked && Boolean(roomId);

  // Show inline start button in player list when game can start and not joining
  const showInlineStart = canStartGame && !isJoiningRoom;

  // Show copy button in room banner when not in joining flow
  const showRoomBannerCopy = !isJoiningRoom;

  // Show join actions (room input + join button) when in joining flow
  const showJoinActions = isJoiningRoom;

  // Show create actions (new room + existing room buttons) when appropriate
  const showCreateActions =
    !isJoiningRoom &&
    !isRoomSelectionLocked &&
    !hasCreatedRoom &&
    isPlayerNameValid;

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
      // Player name input - shown when room not created and (room not locked OR name invalid OR joining)
      hasCreatedRoom
        ? null
        : !isRoomSelectionLocked || !isPlayerNameValid || isJoiningRoom
          ? React.createElement("input", {
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
                if (isCharacterKey && noSelection && playerName.length >= 15) {
                  event.preventDefault();
                }
              },
              disabled: isLoading,
            })
          : null,
      // Join actions: room input/banner + join button (shown when joining)
      showJoinActions
        ? React.createElement(
            "div",
            { className: "setup__actions setup__actions--joining" },
            // Show read-only room banner if room ID is read-only, otherwise show input
            Boolean(isRoomIdReadOnly)
              ? React.createElement(
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
                      displayedRoomId
                    )
                  )
                )
              : React.createElement("input", {
                  id: "room-id-input",
                  className: "setup__room-input",
                  type: "text",
                  placeholder: "Enter room code",
                  value: roomIdInput,
                  onChange: (event) => onRoomIdInputChange(event.target.value),
                  disabled: isLoading,
                }),
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
        : // Create actions: new room + existing room buttons (shown when not joining and room not locked)
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
              ),
              // Existing room button (conditional)
              showJoinButton
                ? React.createElement(
                    "button",
                    {
                      type: "button",
                      className: "setup__button-join-room",
                      onClick: onJoinRoom,
                      disabled: joinDisabled,
                    },
                    "Existing room"
                  )
                : null
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
                      disabled: isLoading || !roomId,
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
