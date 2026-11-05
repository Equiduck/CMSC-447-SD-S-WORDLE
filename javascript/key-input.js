
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

  //Function for submitting the current five-letter guess
  function submitGuess() {
    if (locked || waiting) return;

    //wont submit a guess if it's not long enough
    if (rows[rowIndex].length !== COLUMNS) {
      alert("Please enter a five-letter word.");
      return;
    }

    //converting the letter array into a word
    var guess = rows[rowIndex].join("").toUpperCase();

    //temporary testing until middleware responds
    //Temporary response using Team B's JSON format. Will be removed in final product.
    const response = {
      response_code: 0,
      feedback: "bgggb",
    };

    if (response.response_code === 0) {
      if (!window.WordleGame || typeof window.WordleGame.submitGuess !== "function") {
        response.response_code = -3;
      } else {
        var gameResponse = window.WordleGame.submitGuess(guess.toLowerCase());
        response.response_code = gameResponse.response_code;
        response.feedback = gameResponse.feedback;
      }
    }

    if (response.response_code === 0) {
      console.log("Guess accepted: ", guess);
      console.log("Feedback:", response.feedback);

      //update player turn if accepted
      waiting = true;
      advanceTurn();
      document.dispatchEvent(new CustomEvent("wordle:rowcomplete", {
        detail: {
          rowIndex: rowIndex,
          word: guess.toLowerCase(),
          feedback: response.feedback,
          response: response,
        },
      }));
    }

    //Alerts for handling error response codes
    else if (response.response_code === -1) {
      alert("Invalid request format.");
    } else if (response.response_code === -2) {
      alert("Invalid guess. Please try again.");
    } else if (response.response_code === -3) {
      alert("Unble to validate the answer.");
    } else {
      alert("An unexpected error occured.");
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
