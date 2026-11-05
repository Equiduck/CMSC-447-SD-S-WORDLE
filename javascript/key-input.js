// Letters and Delete for the playing row
(function () {
  "use strict";

  var COLUMNS = 5;
  var ORDINALS = ["th", "st", "nd", "rd"];
  var letters = [];
  var boardRows = document.querySelectorAll(".board .row");
  var rowIndex = 0;
  var row = boardRows[0];
  var tiles = row ? row.querySelectorAll('[data-testid="tile"]') : [];
  var locked = false;
  var waiting = false;

  function ordinal(value) {
    var remainder = value % 100;
    var suffix = ORDINALS[(remainder - 20) % 10] || ORDINALS[remainder] || ORDINALS[0];
    return value + suffix;
  }

  function selectRow(index) {
    rowIndex = Math.min(index, boardRows.length - 1);
    row = boardRows[rowIndex];
    tiles = row ? row.querySelectorAll('[data-testid="tile"]') : [];
    letters = [];
    render();
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
    if (locked || waiting) return;
    // Overflow prevention
    if (letters.length >= COLUMNS) return;
    letters.push(letter);
    render();
  }

  function remove() {
    if (locked || waiting) return;
    if (letters.length === 0) return;
    letters.pop();
    render();
  }

  //Function for submitting the current five-letter guess
  function submitGuess(){
    if (locked || waiting) return;

    //wont submit a guess if it's not long enough
    if(letters.length !== COLUMNS){
      alert("Please enter a five-letter word.");
      return;
    }

    //converting the letter array into a word
    var guess = letters.join("").toUpperCase();

    //temporary testing  until middleware respounds
    console.log("Submitting guess:", guess);

    //Temporary response using team B's JSON format. Will be removed in final product 
    const response ={
      response_code: 0,
      feedback: "bgggb"
    };

    if(response.response_code === 0){
      if (!window.WordleGame || typeof window.WordleGame.submitGuess !== "function") {
        response.response_code = -3;
      } else {
        var gameResponse = window.WordleGame.submitGuess(guess.toLowerCase());
        response.response_code = gameResponse.response_code;
        response.feedback = gameResponse.feedback;
      }
    }

    if(response.response_code === 0){
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
          response: response
        }
      }));
    }

    //Alerts for handling error response codes
    else if(response.response_code === -1){
      alert("Invalid request format.");
    }

    else if(response.response_code === -2){
      alert("Invalid guess. Please try again.");
    }

    else if(response.response_code === -3){
      alert("Unble to validate the answer.");
    }

    else{
      alert("An unexpected error occured.");
    }
  }

  document.addEventListener("wordle:cpuplayed", function (event) {
    waiting = false;
    if (event.detail && typeof event.detail.nextRow === "number") {
      selectRow(event.detail.nextRow);
    }
  });

  document.addEventListener("wordle:gameover", function () {
    locked = true;
    waiting = false;
  });

  document.addEventListener("keydown", function (event) {
    
    //Check if keyboard has been disabled
    var checkbox = document.getElementById("keyboardElement");

    // If disabled, ignore key presses
    if (checkbox && checkbox.checked == true) {
      return;
    }
    // If not disabled, allow key presses
    else {

      // Ignore held keys
      if (event.repeat || event.ctrlKey || event.metaKey || event.altKey) return;
      if (event.key === "Backspace") remove();
      else if(event.key == "Enter"){
        submitGuess();
      }
      else if (/^[a-z]$/i.test(event.key)) add(event.key.toLowerCase());

    }
    
  });

  
  document.addEventListener("click", function (event) {
    var button = event.target.closest(".keyboard-Container button");
    if (!button) return;
    var label = button.textContent.trim().toLowerCase();
    if (label === "delete") remove();

    //submitting guess so call the function
    else if(label == "enter"){
      submitGuess();
    }
    
    else if (/^[a-z]$/.test(label)) add(label);
  });


  render();
})();