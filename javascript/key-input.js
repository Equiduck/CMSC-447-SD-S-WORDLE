
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

  function rejectGuess(row, message) {
    row.setAttribute("data-animation", "invalid");
    document.dispatchEvent(new CustomEvent("wordle:invalidguess", {
      detail: { message: message },
    }));
  }

  function submitGuess() {
    if (locked || waiting) return;
    var language = document.body.dataset.wordLanguage === "spanish" ? "spanish" : "english";
    var row = boardRows[rowIndex];
    var response = { response_code: 0 };

    //Convert the letter array into a word.
    if (rows[rowIndex].length !== COLUMNS) {
      response.response_code = -1;
    }

    if (response.response_code === 0) {
      response.word = rows[rowIndex].join("");
      if (!window.WordleCpu) {
        response.response_code = -3;
      } else if (!window.WordleCpu.isValidGuess(response.word, language)) {
        response.response_code = -2;
      }
    }

    if (response.response_code === 0) {
      document.dispatchEvent(new CustomEvent("wordle:rowcomplete", {
        detail: { rowIndex: rowIndex, word: response.word },
      }));
      //Move to next row after an accepted guess.
      waiting = true;
    } else if (response.response_code === -1) {
      rejectGuess(row, language === "spanish"
        ? "No hay suficientes letras para una palabra."
        : "Not enough letters");
    } else if (response.response_code === -2) {
      rejectGuess(row, language === "spanish"
        ? "La palabra no está en el diccionario."
        : "Not in word list");
    } else if (response.response_code === -3) {
      rejectGuess(row, language === "spanish"
        ? "No se pudo validar la respuesta."
        : "Unable to validate the answer.");
    } else {
      rejectGuess(row, language === "spanish"
        ? "Ocurrió un error inesperado."
        : "An unexpected error occurred.");
    }
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
    //Check if onscreen keyboard input is required.
    var checkbox = document.getElementById("keyboardElement");
    if (checkbox && checkbox.checked) return;

    // Ignore held keys.
    if (event.repeat || event.ctrlKey || event.metaKey || event.altKey) return;
    if (event.key === "Backspace") remove();
    else if (event.key === "Enter") submitGuess();
    else if (/^[a-z]$/i.test(event.key)) add(event.key.toLowerCase());
  });

  
  document.addEventListener("click", function (event) {
    var button = event.target.closest(".keyboard-Container button");
    if (!button) return;
    var label = button.textContent.trim().toLowerCase();
    if (label === "delete") remove();
    else if (label === "enter") submitGuess();
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
