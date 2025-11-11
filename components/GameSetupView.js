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
}) {
  const trimmedRoomId =
    typeof roomIdInput === "string" ? roomIdInput.trim() : "";
  const joinDisabled =
    isLoading ||
    !isPlayerNameValid ||
    (isJoiningRoom && trimmedRoomId.length === 0);
  const createDisabled = isLoading || !isPlayerNameValid;
  const startDisabled = isLoading || !canStartGame || gameStarted;

  return React.createElement(
    "main",
    { className: "app-container setup-container" },
    React.createElement(
      "section",
      { className: "setup__panel" },
      React.createElement("img", {
        src: "./images/box.png",
        alt: "Skyjo game box",
        className: "setup__hero",
      }),
      !isJoiningRoom
        ? React.createElement("input", {
            id: "player-name-input",
            className: "setup__player-input",
            type: "text",
            placeholder: "Your Name",
            maxLength: 20,
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
              if (isCharacterKey && noSelection && playerName.length >= 20) {
                event.preventDefault();
              }
            },
            disabled: isLoading,
          })
        : null,
      isPlayerNameValid
        ? isJoiningRoom
          ? React.createElement(
              "div",
              { className: "setup__actions setup__actions--joining" },
              React.createElement("input", {
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
                "Join Existing Room"
              )
            )
          : React.createElement(
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
                "Create New Room"
              ),
              React.createElement(
                "button",
                {
                  type: "button",
                  className: "setup__button-join-room",
                  onClick: onJoinRoom,
                  disabled: joinDisabled,
                },
                "Join Existing Room"
              )
            )
        : null,
      playerNames.length > 0
        ? React.createElement(
            "ul",
            { className: "setup__players" },
            playerNames.map((name, index) =>
              React.createElement(
                "li",
                {
                  key: name,
                  className: "setup__player",
                  style: {
                    backgroundColor: playerColors[index % playerColors.length],
                  },
                },
                name
              )
            )
          )
        : null,
      isPlayerNameValid && canStartGame
        ? React.createElement(
            "button",
            {
              type: "button",
              className: "setup__start-button",
              onClick: onStartGame,
              disabled: startDisabled,
            },
            "Start"
          )
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
