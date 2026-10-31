// Opt-in demo: index.html?cpu=demo plays the CPU against itself with the local
// dictionary, so the CPU can be seen working before real turn wiring lands.
(function () {
  "use strict";

  if (!/[?&]cpu=demo/.test(window.location.search) || !window.WordleCpu) return;

  var ORDINALS = ["th", "st", "nd", "rd"];
  var rows = document.querySelectorAll(".board .row");
  var game = window.WordleCpu.createGame();
  var rowIndex = 0;

  function ordinal(value) {
    var remainder = value % 100;
    var suffix = ORDINALS[(remainder - 20) % 10] || ORDINALS[remainder] || ORDINALS[0];
    return value + suffix;
  }

  function paint(index, word, feedback) {
    var tiles = rows[index].querySelectorAll('[data-testid="tile"]');
    for (var i = 0; i < tiles.length; i += 1) {
      var letter = word[i].toUpperCase();
      tiles[i].textContent = letter;
      tiles[i].setAttribute("data-state", feedback[i]);
      tiles[i].setAttribute("aria-label", ordinal(i + 1) + " letter, " + letter + ", " + feedback[i]);
    }
  }

  function step() {
    if (rowIndex >= rows.length) return;
    var guess = window.WordleCpu.chooseGuess(game);
    var feedback = window.WordleCpu.record(game, guess);
    paint(rowIndex, guess, feedback);
    rowIndex += 1;
    if (guess !== game.answer && rowIndex < rows.length) window.setTimeout(step, 800);
  }

  step();
})();
