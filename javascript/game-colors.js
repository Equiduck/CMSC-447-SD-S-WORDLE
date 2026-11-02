//Local feedback, turn flow, and result handling.
(function () {
  "use strict";

  if (!window.WordleCpu) return;

  var ORDINALS = ["th", "st", "nd", "rd"];
  var RANK = { absent: 1, present: 2, correct: 3 };
  var FLIP_STAGGER_MS = 300;
  var LANGUAGE_KEY = "shared-wordle-language";
  var MODE_KEY = "shared-wordle-mode";
  var rows = document.querySelectorAll(".board .row");
  var params = new URLSearchParams(window.location.search);
  var requestedLanguage = params.get("lang");
  if (!requestedLanguage) {
    try {
      requestedLanguage = localStorage.getItem(LANGUAGE_KEY);
    } catch (error) {
      requestedLanguage = null;
    }
  }
  var language = /^(es|spanish)$/i.test(requestedLanguage || "") ? "spanish" : "english";
  try {
    localStorage.setItem(LANGUAGE_KEY, language === "spanish" ? "es" : "en");
  } catch (error) {
    //Storage is optional; the URL still selects the language.
  }
  var requestedMode = params.get("mode");
  if (!requestedMode) {
    try {
      requestedMode = localStorage.getItem(MODE_KEY);
    } catch (error) {
      requestedMode = null;
    }
  }
  var playMode = requestedMode === "human" ? "human" : "cpu";
  try {
    localStorage.setItem(MODE_KEY, playMode);
  } catch (error) {
    //Storage is optional; the URL still selects the mode.
  }
  var game = window.WordleCpu.createGame(language);
  document.body.dataset.wordLanguage = language;
  document.body.dataset.playMode = playMode;
  var rivalName = document.getElementById("player2-name");
  if (playMode === "cpu" && rivalName) rivalName.textContent = "CPU";
  var forcedAnswer = params.get("answer");
  if (forcedAnswer && /^[a-z]{5}$/i.test(forcedAnswer)) game.answer = forcedAnswer.toLowerCase();
  var keyStates = {};
  var finished = false;

  function ordinal(value) {
    var remainder = value % 100;
    var suffix = ORDINALS[(remainder - 20) % 10] || ORDINALS[remainder] || ORDINALS[0];
    return value + suffix;
  }

  function paintKeys() {
    var keys = document.querySelectorAll(".keyboard-Container button");
    for (var i = 0; i < keys.length; i += 1) {
      var letter = keys[i].textContent.trim().toLowerCase();
      if (keyStates[letter]) keys[i].setAttribute("data-state", keyStates[letter]);
    }
  }

  function setTurn(turn) {
    var indicator = document.getElementById("turn-indicator");
    var hero = document.getElementById("player1-name");
    var rival = document.getElementById("player2-name");
    var heroStatus = document.getElementById("player1-status");
    var rivalStatus = document.getElementById("player2-status");
    if (!indicator || !hero || !rival) return;
    var cpuTurn = turn === "cpu";
    indicator.textContent = (cpuTurn ? rival.textContent : hero.textContent) + "'s Turn";
    if (heroStatus) heroStatus.textContent = cpuTurn ? "Waiting..." : "Thinking...";
    if (rivalStatus) rivalStatus.textContent = cpuTurn ? "Thinking..." : "Waiting...";
  }

  function finishTile(tile, letter, state, column) {
    labelTile(tile, letter, state, column);
    if (!keyStates[letter] || RANK[state] > RANK[keyStates[letter]]) keyStates[letter] = state;
  }

  function labelTile(tile, letter, state, column) {
    tile.setAttribute("data-state", state);
    tile.setAttribute(
      "aria-label",
      ordinal(column + 1) + " letter, " + letter.toUpperCase() + ", " + state,
    );
  }

  function bounceWinningRow(index, onComplete) {
    var wrappers = rows[index].querySelectorAll(".tile-wrapper");

    for (var i = 0; i < wrappers.length; i += 1) {
      var wrapper = wrappers[i];
      wrapper.style.animationDelay = (i * 100) + "ms";
      wrapper.addEventListener("animationend", function (event) {
        var current = event.currentTarget;
        if (event.animationName !== "wordle-row-bounce") return;
        current.removeAttribute("data-animation");
        current.style.animationDelay = "";
        if (Array.prototype.indexOf.call(wrappers, current) === wrappers.length - 1) {
          onComplete();
        }
      });
      wrapper.setAttribute("data-animation", "win");
    }
  }

  function paintRow(index, word, feedback, onComplete) {
    var tiles = rows[index].querySelectorAll('[data-testid="tile"]');
    var reducedMotion = window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var remaining = tiles.length;

    function completeTile() {
      remaining -= 1;
      if (remaining > 0) return;
      paintKeys();
      if (word === game.answer && !reducedMotion) {
        bounceWinningRow(index, onComplete);
      } else if (onComplete) {
        onComplete();
      }
    }

    for (var i = 0; i < tiles.length; i += 1) {
      var letter = word[i];
      var state = feedback[i];
      tiles[i].textContent = letter.toUpperCase();
      tiles[i].setAttribute("data-state", "tbd");
      tiles[i].setAttribute("data-animation", "idle");
      tiles[i].setAttribute("aria-label", ordinal(i + 1) + " letter, " + letter.toUpperCase());

      if (reducedMotion) {
        finishTile(tiles[i], letter, state, i);
        completeTile();
        continue;
      }

      tiles[i].style.animationDelay = (i * FLIP_STAGGER_MS) + "ms";
      tiles[i].addEventListener("animationend", function (event) {
        var tile = event.currentTarget;
        var column = Array.prototype.indexOf.call(tiles, tile);
        if (event.animationName === "wordle-flip-in") {
          finishTile(tile, word[column], feedback[column], column);
          tile.style.animationDelay = "0ms";
          tile.setAttribute("data-animation", "flip-out");
        } else if (event.animationName === "wordle-flip-out") {
          tile.setAttribute("data-animation", "idle");
          completeTile();
        }
      });
      tiles[i].setAttribute("data-animation", "flip-in");
    }
  }

  function finish(winner) {
    finished = true;
    var indicator = document.getElementById("turn-indicator");
    var heroStatus = document.getElementById("player1-status");
    var rivalStatus = document.getElementById("player2-status");
    if (indicator) {
      indicator.textContent = winner === "human"
        ? "You won!"
        : winner === "cpu"
          ? "CPU wins!"
          : "Game over";
    }
    if (heroStatus) {
      heroStatus.textContent = winner === "human"
        ? "Winner!"
        : winner === "none"
          ? "Out of guesses."
          : "Waiting...";
    }
    if (rivalStatus) {
      rivalStatus.textContent = winner === "cpu"
        ? "Winner!"
        : winner === "none"
          ? "Out of guesses."
          : "Waiting...";
    }
    document.dispatchEvent(new CustomEvent("wordle:gameover", {
      detail: {
        answer: game.answer,
        guesses: game.guesses.length,
        outcome: winner === "human" ? "win" : "loss",
        winner: winner,
      },
    }));
  }

  document.addEventListener("wordle:rowcomplete", function (event) {
    if (finished) return;
    var detail = event.detail;
    var feedback = window.WordleCpu.record(game, detail.word);
    paintRow(detail.rowIndex, detail.word, feedback, function () {
      if (detail.word === game.answer) {
        finish("human");
        return;
      }
      if (detail.rowIndex === rows.length - 1) {
        finish("none");
        return;
      }

      if (playMode === "human") {
        if (typeof window.advanceTurn === "function") window.advanceTurn();
        document.dispatchEvent(new CustomEvent("wordle:cpuplayed", {
          detail: { nextRow: detail.rowIndex + 1 },
        }));
        return;
      }

      //Wait for the CPU before unlocking the next row.
      setTurn("cpu");
      window.setTimeout(function () {
        if (finished) return;
        var cpuGuess = window.WordleCpu.chooseGuess(game);
        var cpuFeedback = window.WordleCpu.record(game, cpuGuess);
        var cpuRow = detail.rowIndex + 1;
        paintRow(cpuRow, cpuGuess, cpuFeedback, function () {
          if (cpuGuess === game.answer) {
            finish("cpu");
            return;
          }
          if (cpuRow === rows.length - 1) {
            finish("none");
            return;
          }
          setTurn("human");
          document.dispatchEvent(new CustomEvent("wordle:cpuplayed", {
            detail: { nextRow: cpuRow + 1 },
          }));
        });
      }, 700);
    });
  });
})();
