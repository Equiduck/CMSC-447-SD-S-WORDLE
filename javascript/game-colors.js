// Local stand-in for server feedback: colours a completed row and the keyboard
// using the CPU evaluator against a locally chosen answer. Replaced when the
// Guess-Submission flow lands.
(function () {
  "use strict";

  if (/[?&]cpu=demo/.test(window.location.search) || !window.WordleCpu) return;

  var ORDINALS = ["th", "st", "nd", "rd"];
  var RANK = { absent: 1, present: 2, correct: 3 };
  var rows = document.querySelectorAll(".board .row");
  var game = window.WordleCpu.createGame();
  var forcedAnswer = new URLSearchParams(window.location.search).get("answer");
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

  function paintRow(index, word, feedback) {
    var tiles = rows[index].querySelectorAll('[data-testid="tile"]');
    for (var i = 0; i < tiles.length; i += 1) {
      var letter = word[i];
      var state = feedback[i];
      tiles[i].textContent = letter.toUpperCase();
      tiles[i].setAttribute("data-state", state);
      tiles[i].setAttribute(
        "aria-label",
        ordinal(i + 1) + " letter, " + letter.toUpperCase() + ", " + state,
      );
      if (!keyStates[letter] || RANK[state] > RANK[keyStates[letter]]) keyStates[letter] = state;
    }
    paintKeys();
  }

  function finish() {
    finished = true;
    document.dispatchEvent(new CustomEvent("wordle:gameover"));
  }

  document.addEventListener("wordle:rowcomplete", function (event) {
    if (finished) return;
    var detail = event.detail;
    var feedback = window.WordleCpu.record(game, detail.word);
    paintRow(detail.rowIndex, detail.word, feedback);
    if (detail.word === game.answer || detail.rowIndex === rows.length - 1) {
      finish();
      return;
    }

    // Player and CPU alternate lines; input stays locked until the CPU plays.
    setTurn("cpu");
    window.setTimeout(function () {
      if (finished) return;
      var cpuGuess = window.WordleCpu.chooseGuess(game);
      var cpuFeedback = window.WordleCpu.record(game, cpuGuess);
      var cpuRow = detail.rowIndex + 1;
      paintRow(cpuRow, cpuGuess, cpuFeedback);
      if (cpuGuess === game.answer || cpuRow === rows.length - 1) {
        finish();
        return;
      }
      setTurn("human");
      document.dispatchEvent(new CustomEvent("wordle:cpuplayed", {
        detail: { nextRow: cpuRow + 1 },
      }));
    }, 700);
  });
})();
