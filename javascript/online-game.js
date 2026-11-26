// Standalone, read-only Team A game-state and invitation view. No Team B calls.
(function () {
  "use strict";
  var api = window.WordleApi;
  var $ = function (id) { return document.getElementById(id); };
  var params = new URLSearchParams(window.location.search);
  var gameId = params.get("game") || api.getSavedGameId();
  var uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  var closed = false;
  var reading = false;
  var timer = null;
  var game = null;
  var stopped = false;
  var rows = [];
  var colors = { b: "absent", y: "present", g: "correct" };

  function message(text, error) {
    var target = $("online-game-feedback");
    target.textContent = text || "";
    target.dataset.error = error ? "true" : "false";
  }

  function createBoard() {
    var board = $("board");
    for (var r = 0; r < 6; r++) {
      var row = document.createElement("div");
      row.className = "row";
      row.style.gridTemplateColumns = "repeat(5, 1fr)";
      row.setAttribute("role", "group");
      row.setAttribute("aria-label", "Row " + (r + 1));
      var tiles = [];
      for (var c = 0; c < 5; c++) {
        var wrapper = document.createElement("div");
        wrapper.className = "tile-wrapper";
        var tile = document.createElement("div");
        tile.className = "tile";
        tile.setAttribute("data-testid", "tile");
        tile.setAttribute("data-state", "empty");
        tile.setAttribute("role", "img");
        tile.setAttribute("aria-label", "Empty letter");
        wrapper.appendChild(tile);
        row.appendChild(wrapper);
        tiles.push(tile);
      }
      board.appendChild(row);
      rows.push(tiles);
    }
  }

  function decodeFeedback(raw) {
    if (Array.isArray(raw)) return raw.map(function (item) {
      if (typeof item !== "string") return "";
      var v = item.toLowerCase();
      return colors[v] ? colors[v] : v;
    });
    if (raw && typeof raw === "object") return decodeFeedback(raw.feedback);
    if (typeof raw !== "string") return [];
    var value = raw.trim().toLowerCase();
    if (/^[byg]{5}$/.test(value)) return value.split("").map(function (x) { return colors[x]; });
    try { return decodeFeedback(JSON.parse(value)); } catch (error) { return []; }
  }

  function fillBoard(state) {
    rows.forEach(function (tiles) {
      tiles.forEach(function (tile) {
        tile.textContent = "";
        tile.setAttribute("data-state", "empty");
        tile.setAttribute("aria-label", "Empty letter");
      });
    });
    (state.guesses || []).slice(0, 6).forEach(function (guess, index) {
      var letters = String(guess.word || "").toUpperCase();
      var feedback = decodeFeedback(guess.feedback);
      rows[index].forEach(function (tile, i) {
        var letter = letters.charAt(i);
        if (!letter) return;
        var color = feedback[i];
        tile.textContent = letter;
        tile.setAttribute("data-state", color === "correct" || color === "present" || color === "absent" ? color : "tbd");
        tile.setAttribute("aria-label", letter + (color ? ", " + color : ""));
      });
    });
  }

  function render(state) {
    game = state;
    var players = state.players || [];
    var session = api.getSession();
    var me = session && session.user_id;
    var first = players[0];
    var second = players[1];
    var turn = state.currentPlayer;
    $("player1-name").textContent = first && first.username || "Player 1";
    $("player2-name").textContent = second && second.username || "Waiting for player…";
    $("player1-status").textContent = first ? "Joined" : "Waiting";
    $("player2-status").textContent = second ? "Joined" : "Waiting";
    if (state.status === "waiting") {
      $("online-heading").textContent = "Waiting for a Friend";
      $("online-message").textContent = "Share the invitation ID or link to start your match.";
      $("turn-indicator").textContent = "Waiting for Player 2";
    } else if (state.status === "started") {
      $("online-heading").textContent = "Online Match";
      $("online-message").textContent = "The server has started your match. Online guessing is awaiting Team A's endpoint.";
      $("turn-indicator").textContent = turn && turn.username
        ? turn.username + "'s Turn"
        : "Awaiting server turn";
      if (turn) {
        var current = turn.turnOrder === 1 ? $("player1-status") : $("player2-status");
        current.textContent = turn.playerId === me ? "Your turn" : "Current turn";
      }
    } else {
      $("online-heading").textContent = "Game " + (state.status || "ended");
      $("online-message").textContent = state.answer
        ? "Answer: " + String(state.answer).toUpperCase()
        : "The game is no longer active.";
      $("turn-indicator").textContent = "Game " + (state.status || "ended");
    }
    $("online-cancel-invite").hidden = !(state.status === "waiting" && first && first.playerId === me);
    fillBoard(state);
  }

  function errorText(error) {
    if (!api.getBaseUrl()) return "Set Team A's server URL in the online lobby.";
    if (error && error.status === 401) return "Session invalid or expired. Log in again from the online lobby.";
    if (error && error.status === 403) return "You are not authorized to view this game.";
    if (error && error.status === 404) return "This game was not found or has been cancelled.";
    return error && error.message || "Unable to contact Team A.";
  }

  function schedule(ms) {
    clearTimeout(timer);
    if (!closed && !stopped) timer = window.setTimeout(refresh, ms);
  }

  async function refresh() {
    if (closed || reading) return;
    if (!api.getBaseUrl() || !api.isAuthenticated()) {
      $("online-heading").textContent = "Login Required";
      message("Sign in through the online lobby before viewing game state.", true);
      stopped = true;
      return;
    }
    if (!uuid.test(String(gameId || ""))) {
      $("online-heading").textContent = "No Game Selected";
      message("Create an invitation or resume a game from the online lobby.", true);
      stopped = true;
      return;
    }
    reading = true;
    $("online-refresh-button").disabled = true;
    try {
      var state = await api.getGame(gameId);
      if (closed) return;
      render(state);
      stopped = false;
      message("Synced with Team A at " + new Date().toLocaleTimeString() + ".");
    } catch (error) {
      if (closed) return;
      message(errorText(error), true);
      stopped = !!(error.status === 401 || error.status === 403 || error.status === 404);
      if (stopped) $("online-heading").textContent = "Game Unavailable";
    } finally {
      reading = false;
      $("online-refresh-button").disabled = false;
      if (!closed && !stopped) schedule(document.hidden ? 10000 : 4000);
    }
  }

  function invitationLink() {
    var link = new URL("online.html", window.location.href);
    link.searchParams.set("invite", gameId);
    return link.href;
  }

  async function copy(value) {
    try {
      if (!navigator.clipboard || !navigator.clipboard.writeText) {
        message("Clipboard unavailable. Copy the displayed ID instead.", true);
        return;
      }
      await navigator.clipboard.writeText(value);
      message("Copied.");
    } catch (error) {
      message("Clipboard access blocked. Copy the displayed ID instead.", true);
    }
  }

  $("online-copy-id").addEventListener("click", function () {
    if (gameId) copy(gameId);
  });
  $("online-copy-link").addEventListener("click", function () {
    if (!gameId) return;
    if (window.location.protocol === "file:") {
      message("Serve the site over HTTP to share a usable link. You can copy the ID instead.", true);
      return;
    }
    copy(invitationLink());
  });
  $("online-cancel-invite").addEventListener("click", async function () {
    if (!game || game.status !== "waiting" || !api.isAuthenticated()) return;
    $("online-cancel-invite").disabled = true;
    try {
      await api.cancelGame(gameId);
      closed = true;
      clearTimeout(timer);
      window.location.assign("online.html");
    } catch (error) {
      message(errorText(error), true);
      $("online-cancel-invite").disabled = false;
    }
  });
  $("online-refresh-button").addEventListener("click", function () {
    stopped = false;
    clearTimeout(timer);
    refresh();
  });
  window.addEventListener("pagehide", function () {
    closed = true;
    clearTimeout(timer);
  });
  document.addEventListener("visibilitychange", function () {
    if (!document.hidden && !closed && !reading) {
      stopped = false;
      clearTimeout(timer);
      refresh();
    }
  });

  createBoard();
  $("online-game-id").textContent = gameId || "—";
  refresh();
})();