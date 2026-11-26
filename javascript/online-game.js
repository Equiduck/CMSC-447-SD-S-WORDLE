// Online board and waiting room. Team C talks only to Team A's game-state API.
(function () {
  "use strict";

  var params = new URLSearchParams(window.location.search);
  if (params.get("mode") !== "human") return;
  var api = window.WordleApi;
  var banner = document.getElementById("online-status-banner");
  var heading = document.getElementById("online-heading");
  var message = document.getElementById("online-message");
  var feedback = document.getElementById("online-game-feedback");
  var identifier = document.getElementById("online-game-id");
  var share = document.getElementById("online-share-controls");
  var cancel = document.getElementById("online-cancel-invite");
  var refreshButton = document.getElementById("online-refresh-button");
  var keyboard = document.querySelector(".keyboard-Container");
  var gameId = params.get("game") || api.getSavedGameId();
  var GAME_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  var timer = null;
  var inFlight = false;
  var disposed = false;
  var game = null;
  var terminalError = false;
  var rank = { absent: 1, present: 2, correct: 3 };

  banner.hidden = false;
  if (keyboard) keyboard.dataset.onlineDisabled = "true";
  if (window.WordleInput) window.WordleInput.setRow(0, [], true);
  document.body.dataset.playMode = "human";
  document.title = "Online Wordle";

  function status(text, error) {
    feedback.textContent = text || "";
    feedback.dataset.error = error ? "true" : "false";
  }

  function gameUrl() {
    var link = new URL("StartScreen.html", window.location.href);
    link.search = "";
    link.searchParams.set("invite", gameId);
    return link.href;
  }

  function displayId() {
    identifier.textContent = gameId || "No game selected";
  }

  async function copy(text) {
    try {
      if (!navigator.clipboard || !navigator.clipboard.writeText) {
        status("Clipboard unavailable. Select and copy the game ID shown above.", true);
        return;
      }
      await navigator.clipboard.writeText(text);
      status("Copied to clipboard.");
    } catch (error) {
      status("Clipboard access was blocked. Select and copy the game ID shown above.", true);
    }
  }

  function stateForLetter(mark) {
    if (mark === "g" || mark === "correct") return "correct";
    if (mark === "y" || mark === "present") return "present";
    if (mark === "b" || mark === "absent") return "absent";
    return "tbd";
  }

  function parseFeedback(raw) {
    if (typeof raw === "string") {
      var value = raw.trim();
      if (/^[byg]{5}$/i.test(value)) return value.toLowerCase().split("");
      try { return parseFeedback(JSON.parse(value)); } catch (error) { return []; }
    }
    if (Array.isArray(raw)) return raw.map(function (value) {
      return typeof value === "string" ? value.toLowerCase() : "";
    });
    if (raw && typeof raw === "object" && raw.feedback) return parseFeedback(raw.feedback);
    return [];
  }

  function repaintBoard(state) {
    var boardRows = document.querySelectorAll(".board .row");
    var guesses = state.guesses || [];
    if (window.WordleInput && boardRows.length) {
      window.WordleInput.setRow(Math.min(guesses.length, boardRows.length - 1), [], true);
    }
    boardRows.forEach(function (row) {
      row.querySelectorAll('[data-testid="tile"]').forEach(function (tile) {
        tile.textContent = "";
        tile.setAttribute("data-state", "empty");
        tile.setAttribute("data-animation", "idle");
        tile.setAttribute("aria-label", "Empty letter");
      });
    });
    var keyboardStates = {};
    guesses.slice(0, boardRows.length).forEach(function (guess, rowIndex) {
      var letters = String(guess.word || "").toUpperCase().split("");
      var marks = parseFeedback(guess.feedback);
      var tiles = boardRows[rowIndex].querySelectorAll('[data-testid="tile"]');
      letters.slice(0, tiles.length).forEach(function (letter, i) {
        var color = stateForLetter(marks[i]);
        tiles[i].textContent = letter;
        tiles[i].setAttribute("data-state", color);
        tiles[i].setAttribute("aria-label", letter + (color === "tbd" ? "" : ", " + color));
        if (rank[color] && (!keyboardStates[letter] || rank[color] > rank[keyboardStates[letter]])) {
          keyboardStates[letter] = color;
        }
      });
    });
    document.querySelectorAll(".keyboard-Container button").forEach(function (button) {
      var key = button.textContent.trim().toUpperCase();
      if (keyboardStates[key]) button.setAttribute("data-state", keyboardStates[key]);
      else button.removeAttribute("data-state");
    });
  }

  function repaint(state) {
    game = state;
    var session = api.getSession();
    var players = state.players || [];
    var first = players[0], second = players[1];
    var myId = session && session.user_id;
    var firstName = first && first.username || "Player 1";
    var secondName = second && second.username || "Waiting for player…";
    document.getElementById("player1-name").textContent = firstName;
    document.getElementById("player2-name").textContent = secondName;
    document.getElementById("player1-status").textContent = first ? "Connected to game" : "Waiting";
    document.getElementById("player2-status").textContent = second ? "Connected to game" : "Waiting";
    if (state.status === "waiting") {
      heading.textContent = "Waiting for a Friend";
      message.textContent = "Share the invitation ID or link. Your game starts when the second player joins.";
      document.getElementById("turn-indicator").textContent = "Waiting for Player 2";
    } else if (state.status === "started") {
      heading.textContent = "Online Match";
      var current = state.currentPlayer;
      var currentName = current && current.username || "Next player";
      document.getElementById("turn-indicator").textContent = currentName + "'s Turn";
      message.textContent = current && current.playerId === myId
        ? "It's your turn. Guess submission will become available after Team A finishes its endpoint."
        : "Waiting for " + currentName + ". Guess submission is not yet available from Team A.";
      if (current) {
        var statusElement = current.turnOrder === 1 ? "player1-status" : "player2-status";
        document.getElementById(statusElement).textContent = "Current turn";
      }
    } else {
      heading.textContent = "Game " + (state.status || "status");
      document.getElementById("turn-indicator").textContent = "Game " + (state.status || "ended");
      message.textContent = state.answer
        ? "The answer was " + state.answer.toUpperCase() + "."
        : "The game is no longer active.";
    }
    share.hidden = state.status !== "waiting" || !first || first.playerId !== myId;
    cancel.hidden = share.hidden;
    repaintBoard(state);
  }

  function describeError(error) {
    if (!api.getBaseUrl()) return "Set Team A's backend URL in Server Settings on the start screen.";
    if (error.status === 401) return "Sign in again to restore this game; your session expired or was rejected.";
    if (error.status === 403) return "This account does not belong to the requested game.";
    if (error.status === 404) return "Team A could not find this game (it may have been cancelled).";
    return (error && error.message) || "Unable to contact Team A.";
  }

  function schedule(ms) {
    clearTimeout(timer);
    if (!disposed) timer = window.setTimeout(refresh, ms);
  }

  async function refresh() {
    if (disposed || inFlight) return;
    if (!api.getBaseUrl() || !api.isAuthenticated()) {
      heading.textContent = "Login Required";
      message.textContent = "Configure Team A's server and sign in from the start screen.";
      status("Online games require a valid Team A session.", true);
      return;
    }
    if (!GAME_ID_PATTERN.test(String(gameId || ""))) {
      heading.textContent = "No Online Game Selected";
      message.textContent = "Open an invitation or use Resume Game on the start screen.";
      status("A valid game ID is required.", true);
      return;
    }
    terminalError = false;
    inFlight = true;
    refreshButton.disabled = true;
    displayId();
    try {
      var next = await api.getGame(gameId);
      if (disposed) return;
      repaint(next);
      status("Connected to Team A. State updated at " +
        new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }) + ".");
    } catch (error) {
      if (disposed) return;
      heading.textContent = "Connection Unavailable";
      status(describeError(error), true);
      if (error.status === 401 || error.status === 403 || error.status === 404) {
        terminalError = true;
        return;
      }
    } finally {
      inFlight = false;
      refreshButton.disabled = false;
      if (!disposed && !terminalError && api.isAuthenticated()) schedule(document.hidden ? 10000 : 4000);
    }
  }

  document.getElementById("online-copy-id").addEventListener("click", function () {
    if (gameId) copy(gameId);
  });
  document.getElementById("online-copy-link").addEventListener("click", function () {
    if (!gameId) return;
    if (window.location.protocol === "file:") {
      status("Share the game ID instead; local file URLs are not usable invitations.", true);
      return;
    }
    copy(gameUrl());
  });
  cancel.addEventListener("click", async function () {
    if (!game || game.status !== "waiting" || !api.isAuthenticated()) return;
    cancel.disabled = true;
    try {
      await api.cancelGame(gameId);
      disposed = true;
      clearTimeout(timer);
      window.location.assign("StartScreen.html");
    } catch (error) {
      status(describeError(error), true);
      cancel.disabled = false;
    }
  });
  refreshButton.addEventListener("click", function () {
    clearTimeout(timer);
    refresh();
  });
  window.addEventListener("pagehide", function () {
    disposed = true;
    clearTimeout(timer);
  });
  document.addEventListener("visibilitychange", function () {
    if (!document.hidden && !disposed && !inFlight) {
      clearTimeout(timer);
      refresh();
    }
  });

  displayId();
  refresh();
})();