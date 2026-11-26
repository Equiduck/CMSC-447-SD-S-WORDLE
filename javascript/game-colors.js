//Game feedback and turn flow.
(function () {
  "use strict";

  // Live multiplayer is server-authoritative and has its own controller.
  if (new URLSearchParams(window.location.search).get("mode") === "human") return;
  if (!window.WordleCpu) return;

  var ORDINALS = ["th", "st", "nd", "rd"];
  var RANK = { absent: 1, present: 2, correct: 3 };
  var FEEDBACK_CODE = { absent: "b", present: "y", correct: "g" };
  var FEEDBACK_STATE = { b: "absent", y: "present", g: "correct" };
  var FLIP_STAGGER_MS = 300;
  var CPU_TYPE_DELAY_MS = 180;
  var FIRST_CPU_ROW = 1;
  var LANGUAGE_KEY = "shared-wordle-language";
  var MODE_KEY = "shared-wordle-mode";
  var DIFFICULTY_KEY = "shared-wordle-difficulty";
  var GAME_KEY = "shared-wordle-active-game";
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
  var requestedDifficulty = params.get("difficulty");
  if (!requestedDifficulty) {
    try {
      requestedDifficulty = localStorage.getItem(DIFFICULTY_KEY);
    } catch (error) {
      requestedDifficulty = null;
    }
  }
  var difficulty = /^(easy|medium|hard)$/i.test(requestedDifficulty || "")
    ? requestedDifficulty.toLowerCase()
    : "hard";
  try {
    localStorage.setItem(DIFFICULTY_KEY, difficulty);
  } catch (error) {
    //Save difficulty.
  }
  var forcedAnswer = params.get("answer");
  var savedGame = forcedAnswer ? null : readSavedGame();
  var game;
  if (savedGame) {
    game = savedGame.game;
    language = savedGame.language;
    playMode = savedGame.playMode;
    difficulty = savedGame.difficulty;
  } else {
    game = window.WordleCpu.createGame(language, difficulty);
  }
  document.body.dataset.wordLanguage = language;
  document.body.dataset.playMode = playMode;
  document.body.dataset.difficulty = difficulty;
  var heroName = document.getElementById("player1-name");
  if (playMode === "cpu" && typeof updatePlayerNames === "function") {
    updatePlayerNames({
      player1: heroName ? heroName.textContent : "",
      player2: "CPU",
    });
  }
  if (forcedAnswer && /^[a-z]{5}$/i.test(forcedAnswer)) game.answer = forcedAnswer.toLowerCase();
  var keyStates = {};
  var finished = savedGame ? Boolean(savedGame.finished) : false;
  var winningPlayer = savedGame ? savedGame.winner : null;

  function readSavedGame() {
    try {
      var saved = JSON.parse(localStorage.getItem(GAME_KEY));
      var savedGame = saved && saved.game;
      if (
        !savedGame ||
        !/^[a-z]{5}$/.test(savedGame.answer || "") ||
        !Array.isArray(savedGame.guesses) ||
        !Array.isArray(savedGame.feedback) ||
        savedGame.guesses.length !== savedGame.feedback.length ||
        savedGame.guesses.length > rows.length
      ) {
        return null;
      }

      saved.game.used = saved.game.used || {};
      saved.language = /^(spanish|es)$/i.test(saved.language || "") ? "spanish" : "english";
      saved.playMode = saved.playMode === "human" ? "human" : "cpu";
      saved.difficulty = /^(easy|medium|hard)$/i.test(saved.difficulty || "")
        ? saved.difficulty.toLowerCase()
        : "hard";
      saved.draft = Array.isArray(saved.draft) ? saved.draft : [];
      if (!saved.finished && savedGame.guesses.length > 0) {
        var lastGuess = savedGame.guesses[savedGame.guesses.length - 1];
        if (lastGuess === savedGame.answer) {
          saved.finished = true;
          saved.winner = (saved.playMode === "human" ||
            (savedGame.guesses.length - 1) % 2 === 0)
            ? "human"
            : "cpu";
        } else if (savedGame.guesses.length === rows.length) {
          saved.finished = true;
          saved.winner = "none";
        }
      }
      return saved;
    } catch (error) {
      return null;
    }
  }

  function saveGame() {
    if (window.WordleGamePersistenceDisabled) return;

    var input = window.WordleInput && window.WordleInput.getState
      ? window.WordleInput.getState()
      : null;
    var draft = input &&
      !input.waiting &&
      input.rowIndex === game.guesses.length
      ? input.letters
      : null;
    try {
      localStorage.setItem(GAME_KEY, JSON.stringify({
        version: 1,
        game: game,
        language: language,
        playMode: playMode,
        difficulty: difficulty,
        draft: draft,
        finished: finished,
        winner: winningPlayer,
      }));
    } catch (error) {
      //Keep the game active for this page if storage is unavailable.
    }
  }

  function encodeFeedback(feedback) {
    var encoded = "";
    for (var i = 0; i < feedback.length; i += 1) {
      encoded += FEEDBACK_CODE[feedback[i]] || "b";
    }
    return encoded;
  }

  function decodeFeedback(feedback) {
    if (Array.isArray(feedback)) return feedback;
    if (typeof feedback !== "string" || feedback.length !== 5) return null;

    var states = [];
    for (var i = 0; i < feedback.length; i += 1) {
      var state = FEEDBACK_STATE[feedback[i]];
      if (!state) return null;
      states.push(state);
    }
    return states;
  }

  function submitGameGuess(word) {
    if (!window.WordleCpu.isValidGuess(word, language)) {
      return { response_code: -2, feedback: "bgggb" };
    }

    var feedback = window.WordleCpu.record(game, word);
    saveGame();
    return {
      response_code: 0,
      feedback: encodeFeedback(feedback),
    };
  }

  window.WordleGame = {
    submitGuess: submitGameGuess,
  };

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

  function restoreBoard() {
    for (var rowIndex = 0; rowIndex < game.guesses.length; rowIndex += 1) {
      var word = game.guesses[rowIndex];
      var feedback = game.feedback[rowIndex];
      var tiles = rows[rowIndex].querySelectorAll('[data-testid="tile"]');
      for (var column = 0; column < tiles.length; column += 1) {
        tiles[column].textContent = word[column].toUpperCase();
        finishTile(tiles[column], word[column], feedback[column], column);
      }
    }
    paintKeys();
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
      if (typeof KeyboardEvent === "function") {
        document.dispatchEvent(new KeyboardEvent("keydown", { key: word[position] }));
      }
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
    var completed = false;

    function complete() {
      if (completed) return;
      completed = true;
      if (onComplete) onComplete();
    }

    window.setTimeout(complete, 1000 + wrappers.length * 100);

    for (var i = 0; i < wrappers.length; i += 1) {
      var wrapper = wrappers[i];
      wrapper.style.animationDelay = (i * 100) + "ms";
      wrapper.addEventListener("animationend", function (event) {
        var current = event.currentTarget;
        if (event.animationName !== "wordle-row-bounce") return;
        current.removeAttribute("data-animation");
        current.style.animationDelay = "";
        if (Array.prototype.indexOf.call(wrappers, current) === wrappers.length - 1) {
          complete();
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
    var completed = false;

    function completeRow() {
      if (completed) return;
      completed = true;
      paintKeys();
      if (word === game.answer && !reducedMotion) {
        bounceWinningRow(index, onComplete);
      } else if (onComplete) {
        onComplete();
      }
    }

    function completeTile() {
      remaining -= 1;
      if (remaining > 0) return;
      completeRow();
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

    if (!reducedMotion) {
      window.setTimeout(function () {
        if (completed) return;
        for (var i = 0; i < tiles.length; i += 1) {
          if (tiles[i].getAttribute("data-state") === "tbd") {
            finishTile(tiles[i], word[i], feedback[i], i);
          }
        }
        completeRow();
      }, FLIP_STAGGER_MS * tiles.length + 1000);
    }
  }

  function playCpuTurn(cpuRow) {
    if (finished) return;

    var cpuGuess = window.WordleCpu.chooseGuess(game, {
      avoidAnswer: cpuRow === FIRST_CPU_ROW,
    });
    var cpuResponse = submitGameGuess(cpuGuess);
    var cpuFeedback = decodeFeedback(cpuResponse.feedback);
    if (cpuResponse.response_code !== 0 || !cpuFeedback) {
      finish("none");
      return;
    }
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
        saveGame();
        advanceTurn();
        document.dispatchEvent(new CustomEvent("wordle:cpuplayed", {
          detail: { nextRow: cpuRow + 1 },
        }));
      });
    });
  }

  function finish(winner) {
    winningPlayer = winner;
    finished = true;
    saveGame();
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
    var feedback = detail.response && decodeFeedback(detail.response.feedback);
    if (!feedback) feedback = window.WordleCpu.record(game, detail.word);
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
        document.dispatchEvent(new CustomEvent("wordle:cpuplayed", {
          detail: { nextRow: detail.rowIndex + 1 },
        }));
        return;
      }

      //Wait for CPU.
      window.setTimeout(function () {
        playCpuTurn(detail.rowIndex + 1);
      }, 700);
    });
  });

  if (!savedGame) {
    saveGame();
  } else {
    function restoreSavedGame() {
      var nextRow = Math.min(game.guesses.length, rows.length - 1);
      restoreBoard();
      if (game.guesses.length % 2 === 1 && typeof advanceTurn === "function") {
        advanceTurn();
      }

      var waitingForCpu = !finished &&
        playMode === "cpu" &&
        nextRow % 2 === 1;

      if (!finished && !waitingForCpu) {
        document.dispatchEvent(new CustomEvent("wordle:cpuplayed", {
          detail: { nextRow: nextRow },
        }));
      }

      if (!finished && window.WordleInput && window.WordleInput.setRow) {
        window.WordleInput.setRow(nextRow, savedGame.draft || [], waitingForCpu);
      }

      if (finished) {
        document.dispatchEvent(new CustomEvent("wordle:gameover", {
          detail: {
            answer: game.answer,
            guesses: game.guesses.length,
            outcome: winningPlayer === "human" ? "win" : "loss",
            winner: winningPlayer,
          },
        }));
        return;
      }

      if (waitingForCpu) {
        playCpuTurn(nextRow);
      }
    }

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", restoreSavedGame, { once: true });
    } else {
      restoreSavedGame();
    }
  }

  window.addEventListener("pagehide", saveGame);
})();
