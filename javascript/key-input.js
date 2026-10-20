// Letters and Delete for the playing row
(function () {
  "use strict";

  var COLUMNS = 5;
  var ORDINALS = ["th", "st", "nd", "rd"];
  var letters = [];
  var row = document.querySelectorAll(".board .row")[0];
  var tiles = row ? row.querySelectorAll('[data-testid="tile"]') : [];

  function ordinal(value) {
    var remainder = value % 100;
    var suffix = ORDINALS[(remainder - 20) % 10] || ORDINALS[remainder] || ORDINALS[0];
    return value + suffix;
  }

  function render() {
    for (var i = 0; i < tiles.length; i += 1) {
      var letter = letters[i] || "";
      tiles[i].textContent = letter.toUpperCase();
      tiles[i].setAttribute("data-state", letter ? "tbd" : "empty");
      tiles[i].setAttribute(
        "aria-label",
        ordinal(i + 1) + " letter, " + (letter ? letter.toUpperCase() : "empty"),
      );
    }
  }

  function add(letter) {
    // Overflow prevention
    if (letters.length >= COLUMNS) return;
    letters.push(letter);
    render();
  }

  function remove() {
    if (letters.length === 0) return;
    letters.pop();
    render();
  }

  document.addEventListener("keydown", function (event) {
    // Ignore held keys
    if (event.repeat || event.ctrlKey || event.metaKey || event.altKey) return;
    if (event.key === "Backspace") remove();
    else if (/^[a-z]$/i.test(event.key)) add(event.key.toLowerCase());
  });

  document.addEventListener("click", function (event) {
    var button = event.target.closest(".keyboard-Container button");
    if (!button) return;
    var label = button.textContent.trim().toLowerCase();
    if (label === "delete") remove();
    else if (/^[a-z]$/.test(label)) add(label);
  });

  render();
})();