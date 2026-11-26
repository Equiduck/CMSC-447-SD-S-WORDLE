// Start-screen navigation, Team A login, matchmaking and invitation flows.
(function () {
  "use strict";

  var api = window.WordleApi;
  var root = document.querySelector(".container");
  var languagePanel = document.querySelector(".popup");
  var loginPanel = document.getElementById("loginPopup");
  var signupPanel = document.getElementById("signupPopup");
  var onlinePanel = document.getElementById("onlinePopup");
  var serverPanel = document.getElementById("serverPopup");
  var panels = [languagePanel, loginPanel, signupPanel, onlinePanel, serverPanel];
  var choices = Array.prototype.slice.call(document.querySelectorAll(".choiceButton"));
  var languageTitle = document.getElementById("language-popup-title");
  var languageDescription = document.getElementById("language-popup-description");
  var username = document.getElementById("username");
  var password = document.getElementById("password");
  var inviteInput = document.getElementById("inviteId");
  var onlineFeedback = document.getElementById("online-feedback");
  var loginFeedback = document.getElementById("warning");
  var serverFeedback = document.getElementById("server-feedback");
  var selectedLanguage = null;
  var selectedMode = null;
  var currentPanel = null;
  var pendingLoginDestination = "online";
  var operationBusy = false;
  var queueActive = false;
  var queueTimer = null;
  var queueGeneration = 0;
  var GAME_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  function showFeedback(element, message, error) {
    element.textContent = message || "";
    element.dataset.error = error ? "true" : "false";
  }

  function showError(error) {
    if (!api.getBaseUrl()) return "Set Team A's backend URL in Server Settings first.";
    if (error && error.status === 401) return "Your login has expired or was rejected. Please sign in again.";
    if (error && error.status === 403) return "This account is not a participant in that game.";
    if (error && error.status === 404) return "The game or account could not be found.";
    if (error && error.status === 409) return error.message || "You are already in an active game.";
    return (error && error.message) || "Unable to connect to Team A's server.";
  }

  function showPanel(panel) {
    panels.forEach(function (item) { item.classList.remove("active"); });
    panel.classList.add("active");
    root.classList.add("active");
    currentPanel = panel;
  }

  function closePanel() {
    if (queueActive) cancelMatchmaking(true);
    panels.forEach(function (item) { item.classList.remove("active"); });
    root.classList.remove("active");
    currentPanel = null;
  }

  function store(key, value) {
    try { localStorage.setItem(key, value); } catch (error) { /* Optional preference. */ }
  }

  function updateAccount() {
    var session = api.getSession();
    var loggedIn = api.isAuthenticated();
    document.getElementById("accountSummary").textContent =
      loggedIn ? "Signed in as " + (session.username || "player") : "Not signed in";
    document.getElementById("signOutStart").hidden = !session;
    document.getElementById("online-signin-required").hidden = loggedIn;
    document.getElementById("apiBaseUrl").value = api.getBaseUrl();
  }

  function gameUrl(gameId) {
    var target = new URL("index.html", window.location.href);
    target.searchParams.set("mode", "human");
    target.searchParams.set("game", gameId);
    return target.href;
  }

  function goToGame(gameId) {
    if (!GAME_ID_PATTERN.test(String(gameId || ""))) {
      showFeedback(onlineFeedback, "Team A returned an invalid game ID.", true);
      return;
    }
    window.location.assign(gameUrl(gameId));
  }

  function requireAccount() {
    if (!api.getBaseUrl()) {
      showFeedback(onlineFeedback, "Set Team A's backend URL in Server Settings first.", true);
      return false;
    }
    if (!api.isAuthenticated()) {
      showFeedback(onlineFeedback, "Log in with your Team A account to use multiplayer.", true);
      document.getElementById("online-signin-required").hidden = false;
      return false;
    }
    return true;
  }

  async function perform(button, action) {
    if (operationBusy || !requireAccount()) return;
    operationBusy = true;
    button.disabled = true;
    showFeedback(onlineFeedback, "");
    try {
      await action();
    } catch (error) {
      showFeedback(onlineFeedback, showError(error), true);
    } finally {
      operationBusy = false;
      button.disabled = button.id === "quickMatchButton" && queueActive;
    }
  }

  function resetLanguageStep() {
    selectedLanguage = null;
    selectedMode = null;
    languageTitle.textContent = "Language Selector";
    languageDescription.textContent = "Please Select Your Preferred Game Language";
    ["English", "Spanish", ""].forEach(function (text, index) {
      choices[index].textContent = text;
      choices[index].hidden = index === 2;
      choices[index].href = "#";
      delete choices[index].dataset.language;
      delete choices[index].dataset.mode;
      delete choices[index].dataset.difficulty;
    });
    choices[0].dataset.language = "en";
    choices[1].dataset.language = "es";
  }

  function showPlayModeStep(language) {
    selectedLanguage = language;
    selectedMode = null;
    languageTitle.textContent = "Type of Play";
    languageDescription.textContent = "Choose your game mode";
    ["Human (Online)", "CPU", ""].forEach(function (text, index) {
      choices[index].textContent = text;
      choices[index].hidden = index === 2;
      choices[index].href = "#";
      delete choices[index].dataset.language;
      delete choices[index].dataset.mode;
      delete choices[index].dataset.difficulty;
    });
    choices[0].dataset.mode = "human";
    choices[1].dataset.mode = "cpu";
  }

  function showDifficultyStep() {
    selectedMode = "cpu";
    languageTitle.textContent = "Difficulty";
    languageDescription.textContent = "Select Your Preferred Difficulty";
    ["easy", "medium", "hard"].forEach(function (difficulty, index) {
      choices[index].textContent = difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
      choices[index].hidden = false;
      choices[index].dataset.difficulty = difficulty;
      delete choices[index].dataset.language;
      delete choices[index].dataset.mode;
      choices[index].href = "index.html?lang=" + selectedLanguage +
        "&mode=cpu&difficulty=" + difficulty;
    });
  }

  choices.forEach(function (choice) {
    choice.addEventListener("click", function (event) {
      if (choice.dataset.language) {
        event.preventDefault();
        store("shared-wordle-language", choice.dataset.language);
        showPlayModeStep(choice.dataset.language);
      } else if (choice.dataset.mode) {
        event.preventDefault();
        selectedMode = choice.dataset.mode;
        store("shared-wordle-mode", selectedMode);
        if (selectedMode === "cpu") {
          showDifficultyStep();
        } else {
          openOnline();
        }
      } else if (choice.dataset.difficulty) {
        store("shared-wordle-language", selectedLanguage);
        store("shared-wordle-mode", "cpu");
        store("shared-wordle-difficulty", choice.dataset.difficulty);
      }
    });
  });

  function openOnline() {
    updateAccount();
    showFeedback(onlineFeedback, "");
    showPanel(onlinePanel);
    // Restore matchmaking queue state after navigating away/reloading the page.
    if (queueActive || operationBusy || !api.isAuthenticated() || !api.getBaseUrl()) return;
    var generation = ++queueGeneration;
    api.getMatchmaking().then(function (result) {
      if (currentPanel !== onlinePanel || queueActive || operationBusy || generation !== queueGeneration) return;
      if (result && result.queued) {
        queueActive = true;
        showQueue(true);
        showFeedback(onlineFeedback, "You're still in Team A's matchmaking queue.");
        scheduleQueuePoll(generation);
      } else if (result && result.game_id) {
        showFeedback(onlineFeedback, "You already have an active game. Select Resume Game.");
      }
    }).catch(function () {
      // A missing server should not stop the player from entering settings.
    });
  }

  document.getElementById("onlineDirectButton").addEventListener("click", function (event) {
    event.preventDefault();
    openOnline();
  });
  document.getElementById("playButton").addEventListener("click", function (event) {
    event.preventDefault();
    resetLanguageStep();
    showPanel(languagePanel);
  });
  document.getElementById("exitButton").addEventListener("click", function (event) {
    event.preventDefault();
    closePanel();
  });
  document.getElementById("exitLogin").addEventListener("click", function (event) {
    event.preventDefault();
    closePanel();
  });
  document.getElementById("exitSignup").addEventListener("click", closePanel);
  document.getElementById("exitOnline").addEventListener("click", closePanel);
  document.getElementById("exitServer").addEventListener("click", closePanel);
  document.getElementById("signupButton").addEventListener("click", function (event) {
    event.preventDefault();
    showPanel(signupPanel);
  });
  document.getElementById("signupLoginButton").addEventListener("click", function () {
    showPanel(loginPanel);
  });
  document.getElementById("loginButton").addEventListener("click", function (event) {
    event.preventDefault();
    pendingLoginDestination = "home";
    showPanel(loginPanel);
  });
  document.getElementById("onlineLoginButton").addEventListener("click", function () {
    pendingLoginDestination = "online";
    showPanel(loginPanel);
  });

  document.getElementById("loginForm").addEventListener("submit", async function (event) {
    event.preventDefault();
    if (operationBusy) return;
    if (!api.getBaseUrl()) {
      showFeedback(loginFeedback, "Set Team A's backend URL in Server Settings first.", true);
      return;
    }
    if (!username.value.trim() || !password.value) {
      showFeedback(loginFeedback, "Please enter a username and password.", true);
      return;
    }
    operationBusy = true;
    var button = document.getElementById("submit");
    button.disabled = true;
    showFeedback(loginFeedback, "");
    try {
      await api.login({ username: username.value.trim(), password: password.value });
      password.value = "";
      store("triggered", "true");
      updateAccount();
      showFeedback(document.getElementById("success"), "Successfully logged in");
      if (pendingLoginDestination === "online" || inviteInput.value) {
        openOnline();
      } else {
        closePanel();
      }
    } catch (error) {
      store("triggered", "false");
      showFeedback(loginFeedback, showError(error), true);
    } finally {
      operationBusy = false;
      button.disabled = false;
    }
  });

  function openServer() {
    if (queueActive) cancelMatchmaking(true);
    updateAccount();
    showFeedback(serverFeedback, "");
    showPanel(serverPanel);
  }
  document.getElementById("apiSettingsButton").addEventListener("click", openServer);
  document.getElementById("onlineServerSettingsButton").addEventListener("click", openServer);

  document.getElementById("serverForm").addEventListener("submit", function (event) {
    event.preventDefault();
    try {
      var next = document.getElementById("apiBaseUrl").value.trim();
      var previous = api.getBaseUrl();
      api.configure(next);
      if (previous !== next) {
        api.clearSession();
        store("triggered", "false");
      }
      updateAccount();
      showFeedback(serverFeedback, "Server saved. Sign in to use online play.");
    } catch (error) {
      showFeedback(serverFeedback, showError(error), true);
    }
  });

  document.getElementById("signOutStart").addEventListener("click", function () {
    if (queueActive) cancelMatchmaking(true);
    api.clearSession();
    store("triggered", "false");
    updateAccount();
    showFeedback(document.getElementById("success"), "Signed out");
  });

  document.getElementById("createInviteButton").addEventListener("click", function () {
    var button = this;
    perform(button, async function () {
      var game = await api.createGame();
      goToGame(game.gameId);
    });
  });

  document.getElementById("joinInviteFocusButton").addEventListener("click", function () {
    inviteInput.focus();
  });
  document.getElementById("joinInviteForm").addEventListener("submit", function (event) {
    event.preventDefault();
    var gameId = inviteInput.value.trim();
    if (!GAME_ID_PATTERN.test(gameId)) {
      showFeedback(onlineFeedback, "Paste a valid UUID from your friend's invitation.", true);
      return;
    }
    perform(document.getElementById("joinInviteButton"), async function () {
      var result = await api.joinGame(gameId);
      goToGame(result.gameId);
    });
  });

  document.getElementById("resumeGameButton").addEventListener("click", function () {
    perform(this, async function () {
      var game = await api.resumeGame();
      if (!game || (game.status !== "started" && game.status !== "waiting")) {
        showFeedback(onlineFeedback, "No unfinished game was found for this account.");
      } else {
        goToGame(game.gameId);
      }
    });
  });

  function showQueue(active) {
    document.getElementById("matchmakingLobby").hidden = !active;
    document.getElementById("quickMatchButton").disabled = active;
  }

  function scheduleQueuePoll(generation) {
    clearTimeout(queueTimer);
    queueTimer = setTimeout(function () { pollQueue(generation); }, 3000);
  }

  async function pollQueue(generation) {
    if (!queueActive || generation !== queueGeneration) return;
    try {
      var result = await api.getMatchmaking();
      if (!queueActive || generation !== queueGeneration) return;
      if (result && result.game_id) {
        queueActive = false;
        showQueue(false);
        goToGame(result.game_id);
        return;
      }
      if (!result || !result.queued) {
        queueActive = false;
        showQueue(false);
        showFeedback(onlineFeedback, "Matchmaking ended without a game. Try again.");
        return;
      }
      scheduleQueuePoll(generation);
    } catch (error) {
      if (queueActive && generation === queueGeneration) {
        showFeedback(onlineFeedback, showError(error) + " Retrying…", true);
        scheduleQueuePoll(generation);
      }
    }
  }

  async function cancelMatchmaking(silent) {
    if (!queueActive) return;
    queueActive = false;
    queueGeneration += 1;
    clearTimeout(queueTimer);
    showQueue(false);
    try {
      await api.leaveMatchmaking();
      if (!silent) showFeedback(onlineFeedback, "Matchmaking cancelled.");
    } catch (error) {
      if (!silent) showFeedback(onlineFeedback, showError(error), true);
    }
  }

  document.getElementById("cancelMatchButton").addEventListener("click", function () {
    cancelMatchmaking(false);
  });
  document.getElementById("quickMatchButton").addEventListener("click", function () {
    var button = this;
    if (queueActive) return;
    perform(button, async function () {
      var result = await api.joinMatchmaking();
      if (result && result.game_id) {
        goToGame(result.game_id);
        return;
      }
      if (!result || !result.queued) {
        showFeedback(onlineFeedback, "Team A returned an unexpected matchmaking response.", true);
        return;
      }
      queueActive = true;
      queueGeneration += 1;
      showQueue(true);
      showFeedback(onlineFeedback, "Looking for a player with your account language.");
      scheduleQueuePoll(queueGeneration);
    });
  });

  document.getElementById("currentDate").textContent =
    new Date().toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && currentPanel) closePanel();
  });

  updateAccount();
  resetLanguageStep();
  var sharedInvite = new URLSearchParams(window.location.search).get("invite");
  if (sharedInvite) {
    inviteInput.value = sharedInvite;
    openOnline();
    showFeedback(onlineFeedback, "Review the invitation and sign in before joining.");
  }
})();