//Game feedback and turn flow.
(function () {
  "use strict";

  if (!window.WordleCpu) return;

  var ORDINALS = ["th", "st", "nd", "rd"];
  var RANK = { absent: 1, present: 2, correct: 3 };
  var FLIP_STAGGER_MS = 300;
  var CPU_TYPE_DELAY_MS = 180;
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
    //Save language.
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
    //Save mode.
  }
  var game = window.WordleCpu.createGame(language);
  document.body.dataset.wordLanguage = language;
  document.body.dataset.playMode = playMode;
  var heroName = document.getElementById("player1-name");
  if (playMode === "cpu" && window.WordleBoard) {
    window.WordleBoard.updatePlayerNames({
      player1: heroName ? heroName.textContent : "",
      player2: "CPU",
    });
  }
  var forcedAnswer = params.get("answer");
  if (forcedAnswer && /^[a-z]{5}$/i.test(forcedAnswer)) game.answer = forcedAnswer.toLowerCase();
  var keyStates = {};
  var finished = false;
  var toast = document.getElementById("game-toast");
  var toastTimer;

  function showToast(text) {
    if (!toast) return;
    clearTimeout(toastTimer);
    toast.textContent = text;
    toast.dataset.visible = "true";
    toastTimer = window.setTimeout(function () {
      toast.dataset.visible = "false";
    }, 1500);
  }

  function advanceBoardTurn() {
    if (window.WordleBoard) window.WordleBoard.advanceTurn();
  }

  function finishBoardTurn(winner) {
    if (window.WordleBoard) window.WordleBoard.finishTurnDisplay(winner);
  }

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

  function typeWord(index, word, onComplete) {
    var tiles = rows[index].querySelectorAll('[data-testid="tile"]');
    var reducedMotion = window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) {
      for (var i = 0; i < tiles.length; i += 1) {
        tiles[i].textContent = word[i].toUpperCase();
        tiles[i].setAttribute("data-state", "tbd");
        tiles[i].setAttribute(
          "aria-label",
          ordinal(i + 1) + " letter, " + word[i].toUpperCase(),
        );
      }
      if (onComplete) onComplete();
      return;
    }

    var position = 0;
    function typeNextLetter() {
      if (finished) return;
      var tile = tiles[position];
      tile.textContent = word[position].toUpperCase();
      tile.setAttribute("data-state", "tbd");
      tile.setAttribute("data-animation", "pop");
      tile.setAttribute(
        "aria-label",
        ordinal(position + 1) + " letter, " + word[position].toUpperCase(),
      );
      position += 1;

      if (position < word.length) {
        window.setTimeout(typeNextLetter, CPU_TYPE_DELAY_MS);
      } else {
        window.setTimeout(function () {
          if (onComplete) onComplete();
        }, CPU_TYPE_DELAY_MS);
      }
    }
    typeNextLetter();
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
    finishBoardTurn(winner);
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
        advanceBoardTurn();
        document.dispatchEvent(new CustomEvent("wordle:cpuplayed", {
          detail: { nextRow: detail.rowIndex + 1 },
        }));
        return;
      }

      //Wait for CPU.
      advanceBoardTurn();
      window.setTimeout(function () {
        if (finished) return;
        var cpuGuess = window.WordleCpu.chooseGuess(game);
        var cpuFeedback = window.WordleCpu.record(game, cpuGuess);
        var cpuRow = detail.rowIndex + 1;
        typeWord(cpuRow, cpuGuess, function () {
          paintRow(cpuRow, cpuGuess, cpuFeedback, function () {
            if (cpuGuess === game.answer) {
              finish("cpu");
              return;
            }
            if (cpuRow === rows.length - 1) {
              finish("none");
              return;
            }
            advanceBoardTurn();
            document.dispatchEvent(new CustomEvent("wordle:cpuplayed", {
              detail: { nextRow: cpuRow + 1 },
            }));
          });
        });
      }, 700);
    });
  });

  document.addEventListener("wordle:invalidguess", function (event) {
    if (event.detail && event.detail.message) showToast(event.detail.message);
  });
})();
