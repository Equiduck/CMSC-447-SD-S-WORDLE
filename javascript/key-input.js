// Letters and Delete for the playing row
(function () {
  "use strict";

  var COLUMNS = 5;
  var ORDINALS = ["th", "st", "nd", "rd"];
  var boardRows = document.querySelectorAll(".board .row");
  var rows = [];
  var rowIndex = 0;
  var locked = false;
  var waiting = false;

  for (var r = 0; r < boardRows.length; r += 1) rows.push([]);

  function ordinal(value) {
    var remainder = value % 100;
    var suffix = ORDINALS[(remainder - 20) % 10] || ORDINALS[remainder] || ORDINALS[0];
    return value + suffix;
  }

  function tilesFor(index) {
    var row = boardRows[index];
    return row ? row.querySelectorAll('[data-testid="tile"]') : [];
  }

  function render(index) {
    var tiles = tilesFor(index);
    var letters = rows[index] || [];
    for (var i = 0; i < tiles.length; i += 1) {
      var letter = letters[i] || "";
      var previousLetter = tiles[i].textContent.toLowerCase();
      tiles[i].textContent = letter.toUpperCase();
      tiles[i].setAttribute("data-state", letter ? "tbd" : "empty");
      if (letter && letter !== previousLetter) tiles[i].setAttribute("data-animation", "pop");
      tiles[i].setAttribute(
        "aria-label",
        ordinal(i + 1) + " letter, " + (letter ? letter.toUpperCase() : "empty"),
      );
    }
  }

  function add(letter) {
    if (locked || waiting) return;
    //Stop at five letters.
    if (rows[rowIndex].length >= COLUMNS) return;
    rows[rowIndex].push(letter);
    render(rowIndex);
  }

  function remove() {
    if (locked || waiting) return;
    //Keep previous rows.
    if (rows[rowIndex].length === 0) return;
    rows[rowIndex].pop();
    render(rowIndex);
  }

  function submit() {
    if (locked || waiting) return;
    var language = document.body.dataset.wordLanguage === "spanish" ? "spanish" : "english";
    var row = boardRows[rowIndex];
    //Submit valid row.
    if (rows[rowIndex].length !== COLUMNS) {
      row.setAttribute("data-animation", "invalid");
      document.dispatchEvent(new CustomEvent("wordle:invalidguess", {
        detail: {
          message: language === "spanish"
            ? "No hay suficientes letras para una palabra."
            : "Not enough letters",
        },
      }));
      return;
    }
    var word = rows[rowIndex].join("");
    if (!window.WordleCpu || !window.WordleCpu.isValidGuess(word, language)) {
      row.setAttribute("data-animation", "invalid");
      document.dispatchEvent(new CustomEvent("wordle:invalidguess", {
        detail: {
          message: language === "spanish"
            ? "La palabra no está en el diccionario."
            : "Not in word list",
        },
      }));
      return;
    }
    document.dispatchEvent(new CustomEvent("wordle:rowcomplete", {
      detail: { rowIndex: rowIndex, word: word },
    }));
    //Move to next row.
    waiting = true;
  }

  document.addEventListener("wordle:cpuplayed", function (event) {
    waiting = false;
    if (event.detail && typeof event.detail.nextRow === "number") {
      rowIndex = Math.min(event.detail.nextRow, rows.length - 1);
    }
  });

  document.addEventListener("wordle:gameover", function () {
    locked = true;
    waiting = false;
  });

  document.addEventListener("keydown", function (event) {
    // Ignore held keys
    if (event.repeat || event.ctrlKey || event.metaKey || event.altKey) return;
    if (event.key === "Backspace") remove();
    else if (event.key === "Enter") submit();
    else if (/^[a-z]$/i.test(event.key)) add(event.key.toLowerCase());
  });

  document.addEventListener("click", function (event) {
    var button = event.target.closest(".keyboard-Container button");
    if (!button) return;
    var label = button.textContent.trim().toLowerCase();
    if (label === "delete") remove();
    else if (label === "enter") submit();
    else if (/^[a-z]$/.test(label)) add(label);
  });

  var board = document.getElementById("board");
  if (board) {
    board.addEventListener("animationend", function (event) {
      if (event.animationName === "wordle-tile-pop" &&
          event.target.getAttribute("data-animation") === "pop") {
        event.target.setAttribute("data-animation", "idle");
      }
      if (event.animationName === "wordle-row-shake" &&
          event.target.getAttribute("data-animation") === "invalid") {
        event.target.removeAttribute("data-animation");
      }
    });
  }

  render(rowIndex);
})();
