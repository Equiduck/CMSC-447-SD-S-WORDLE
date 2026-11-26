// Isolated online lobby: Team C calls only Team A's HTTP API.
(function () {
  "use strict";
  var api = window.WordleApi;
  var $ = function (id) { return document.getElementById(id); };
  var uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  var queueTimer = null;
  var queueActive = false;
  var generation = 0;
  var busy = false;

  function message(id, value, isError) {
    var element = $(id);
    element.textContent = value || "";
    element.dataset.error = isError ? "true" : "false";
  }

  function errorText(error) {
    if (!api.getBaseUrl()) return "Set Team A's server URL first.";
    if (error && error.status === 401) return "Session expired or invalid. Log in again.";
    if (error && error.status === 403) return "This account cannot access that game.";
    if (error && error.status === 404) return "That game could not be found.";
    return (error && error.message) || "Team A's server is unavailable.";
  }

  function refreshAccount() {
    var active = api.isAuthenticated();
    var session = api.getSession();
    $("loginForm").hidden = active;
    $("signedIn").hidden = !active;
    $("accountName").textContent = active ? "Signed in as " + (session.username || "player") : "";
    $("apiBaseUrl").value = api.getBaseUrl();
    ["createButton", "matchButton", "resumeButton", "joinButton"].forEach(function (id) {
      $(id).disabled = !active || busy || queueActive;
    });
    $("cancelQueueButton").disabled = busy;
  }

  function enterGame(gameId) {
    if (!uuid.test(String(gameId || ""))) {
      message("playFeedback", "Team A returned an invalid game ID.", true);
      return;
    }
    var target = new URL("online-game.html", window.location.href);
    target.searchParams.set("game", gameId);
    window.location.assign(target.href);
  }

  function accountRequired() {
    if (!api.getBaseUrl()) {
      message("playFeedback", "Set Team A's server URL first.", true);
      return false;
    }
    if (!api.isAuthenticated()) {
      message("playFeedback", "Log in with an existing Team A account.", true);
      return false;
    }
    return true;
  }

  async function action(work) {
    if (busy || queueActive || !accountRequired()) return;
    busy = true;
    refreshAccount();
    message("playFeedback", "");
    try {
      await work();
    } catch (error) {
      message("playFeedback", errorText(error), true);
    } finally {
      busy = false;
      refreshAccount();
    }
  }

  function setQueue(active) {
    queueActive = active;
    $("queuePanel").hidden = !active;
    refreshAccount();
  }

  function stopQueue() {
    clearTimeout(queueTimer);
    generation++;
    setQueue(false);
  }

  function schedulePoll(version) {
    clearTimeout(queueTimer);
    queueTimer = window.setTimeout(function () { pollQueue(version); }, 3000);
  }

  async function pollQueue(version) {
    if (!queueActive || version !== generation) return;
    try {
      var state = await api.getMatchmaking();
      if (!queueActive || version !== generation) return;
      if (state && state.game_id) {
        stopQueue();
        enterGame(state.game_id);
      } else if (state && state.queued) {
        schedulePoll(version);
      } else {
        stopQueue();
        message("playFeedback", "Matchmaking ended. You can try again.");
      }
    } catch (error) {
      if (version !== generation) return;
      if (error.status === 401) {
        stopQueue();
        message("playFeedback", errorText(error), true);
        return;
      }
      message("playFeedback", errorText(error) + " Retrying…", true);
      schedulePoll(version);
    }
  }

  async function detectQueue() {
    if (!api.getBaseUrl() || !api.isAuthenticated() || busy || queueActive) return;
    var version = ++generation;
    try {
      var state = await api.getMatchmaking();
      if (version !== generation || !api.isAuthenticated()) return;
      if (state && state.queued) {
        setQueue(true);
        message("playFeedback", "You are still in Team A's matchmaking queue.");
        schedulePoll(version);
      } else if (state && state.game_id) {
        message("playFeedback", "You have an active game. Select Resume Game.");
      }
    } catch (error) {
      message("playFeedback", errorText(error), true);
    }
  }

  $("serverForm").addEventListener("submit", function (event) {
    event.preventDefault();
    var next = $("apiBaseUrl").value.trim();
    if (queueActive) {
      message("serverFeedback", "Cancel matchmaking before switching servers.", true);
      return;
    }
    try {
      var old = api.getBaseUrl();
      api.configure(next);
      if (old !== next) {
        stopQueue();
        api.clearSession();
      }
      refreshAccount();
      message("serverFeedback", "Server saved.");
    } catch (error) {
      message("serverFeedback", errorText(error), true);
    }
  });

  $("loginForm").addEventListener("submit", async function (event) {
    event.preventDefault();
    if (busy) return;
    if (!api.getBaseUrl()) {
      message("loginFeedback", "Set Team A's server URL first.", true);
      return;
    }
    busy = true;
    $("loginButton").disabled = true;
    message("loginFeedback", "");
    var authenticated = false;
    try {
      await api.login({
        username: $("username").value.trim(),
        password: $("password").value,
      });
      authenticated = true;
      $("password").value = "";
      message("loginFeedback", "Successfully logged in.");
      refreshAccount();
    } catch (error) {
      message("loginFeedback", errorText(error), true);
    } finally {
      busy = false;
      $("loginButton").disabled = false;
      refreshAccount();
    }
    if (authenticated) await detectQueue();
  });

  $("logoutButton").addEventListener("click", function () {
    // Explicit logout, not a queue-cancel request: warn about queued state.
    if (queueActive) {
      message("playFeedback", "Cancel matchmaking before signing out.", true);
      return;
    }
    generation++;
    api.clearSession();
    refreshAccount();
    message("loginFeedback", "Signed out.");
  });

  $("createButton").addEventListener("click", function () {
    action(async function () {
      var result = await api.createGame();
      enterGame(result.gameId);
    });
  });

  $("joinForm").addEventListener("submit", function (event) {
    event.preventDefault();
    var gameId = $("inviteId").value.trim();
    if (!uuid.test(gameId)) {
      message("playFeedback", "Enter a valid invitation game UUID.", true);
      return;
    }
    action(async function () {
      var result = await api.joinGame(gameId);
      enterGame(result.gameId);
    });
  });

  $("resumeButton").addEventListener("click", function () {
    action(async function () {
      var state = await api.resumeGame();
      if (state && (state.status === "waiting" || state.status === "started")) {
        enterGame(state.gameId);
      } else {
        message("playFeedback", "No unfinished game was found.");
      }
    });
  });

  $("matchButton").addEventListener("click", function () {
    action(async function () {
      var result = await api.joinMatchmaking();
      if (result && result.game_id) {
        enterGame(result.game_id);
      } else if (result && result.queued) {
        var version = ++generation;
        setQueue(true);
        message("playFeedback", "Searching for an opponent…");
        schedulePoll(version);
      } else {
        message("playFeedback", "Unexpected matchmaking response from Team A.", true);
      }
    });
  });

  $("cancelQueueButton").addEventListener("click", async function () {
    if (!queueActive || busy) return;
    busy = true;
    refreshAccount();
    try {
      await api.leaveMatchmaking();
      stopQueue();
      message("playFeedback", "Matchmaking cancelled.");
    } catch (error) {
      message("playFeedback", errorText(error), true);
    } finally {
      busy = false;
      refreshAccount();
    }
  });

  var invite = new URLSearchParams(window.location.search).get("invite");
  if (invite) {
    $("inviteId").value = invite;
    message("playFeedback", "Sign in, then select Join Invite.");
  }
  refreshAccount();
  detectQueue();
})();