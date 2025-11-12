import React from "https://esm.sh/react@18?dev";

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
}) {
  const displayedRoomId =
    typeof roomIdInput === "string" && roomIdInput.trim().length > 0
      ? roomIdInput.trim()
      : roomId;
  const trimmedRoomId =
    typeof roomIdInput === "string" ? roomIdInput.trim() : "";
  const joinDisabled =
    isLoading ||
    !isPlayerNameValid ||
    (isJoiningRoom && trimmedRoomId.length === 0);
  const createDisabled = isLoading || !isPlayerNameValid;
  const startDisabled = isLoading || !canStartGame || gameStarted;
  const showJoinButton =
    !hasCreatedRoom && !isRoomSelectionLocked && !isJoiningRoom;
  const shouldShowRoomInfo =
    !isJoiningRoom && isRoomSelectionLocked && Boolean(roomId);
  const showInlineStart = canStartGame && !isJoiningRoom;
  const showRoomBannerCopy = !isJoiningRoom;
  const showJoinActions = isJoiningRoom;
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
      React.createElement("img", {
        src: "./assets/images/box.png",
        alt: "Skyjo game box",
        className: "setup__hero",
      }),
      hasCreatedRoom
        ? null
        : !isRoomSelectionLocked || !isPlayerNameValid || isJoiningRoom
          ? React.createElement("input", {
              id: "player-name-input",
              className: "setup__player-input",
              type: "text",
              placeholder: "Your Name",
              maxLength: 15,
              value: playerName,
              onChange: (event) => onPlayerNameChange(event.target.value),
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
      showJoinActions
        ? React.createElement(
            "div",
            { className: "setup__actions setup__actions--joining" },
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
        : showCreateActions
          ? React.createElement(
              "div",
              { className: "setup__actions" },
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
        : null,
      isPlayerNameValid && canStartGame && !shouldShowRoomInfo && !isJoiningRoom
        ? null
        : null
    ),
    errorMessage
      ? React.createElement(
          "p",
          { className: "error", role: "alert" },
          errorMessage
        )
      : null
  );
}
