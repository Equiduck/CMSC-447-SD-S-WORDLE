// Letters and Delete for the playing row
(function () {
  "use strict";

  //check if spanish was selected 
  var check = new URLSearchParams(window.location.search);
  var selectedLanguage = check.get("lang") || localStorage.getItem("shared-wordle-language") || "en";
  var spanish = selectedLanguage === "es";

  //display spanish keybaord instructions
  var spanishKeyboardTip = document.getElementById("spanish-keyboard-tip")
  if(spanishKeyboardTip){
    spanishKeyboardTip.hidden = !spanish;
  }

  //close instructions
  var closeKeyboardTip = document.getElementById("close-keyboard-tip");
  if(closeKeyboardTip && spanishKeyboardTip){
    closeKeyboardTip.addEventListener("click", function(){
      spanishKeyboardTip.hidden = true;
    })
  }

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

  //letters that have accents in spanish
  var accentLetters = { a: ["a", "á"], e:["e", 'é'], i:["i", "í"], o:["o","ó"], u:["u","ú","ü"], n:["n","ñ"]};

  //variables for when a key is held
  var holdTimer = null;
  var heldLetter = null;
  var popupOpened = false;

  //find the accent popup elements in HTML
  var accentPopup = document.getElementById("accent-popup");
  var accentOptions = document.getElementById("accent-options");
  var closeAccentButton = document.getElementById("close-accent-popup");
  var accentOverlay = document.getElementById("accent-overlay");

  //closing the popup for accent keys
  function closeAccentPopup(){
    accentPopup.hidden = true;
    accentOverlay.hidden = true;
    accentOptions.innerHTML = "";
  }

  //open the accent popup for the selected letter but only if spanish is the language 
  function openAccentPopup(letter){
    if(!spanish || locked || waiting) return;
    if(!accentPopup || !accentOptions) return;

    var options = accentLetters[letter];

    if(!options) return;

    popupOpened = true;
    accentOptions.innerHTML = "";

    options.forEach(function(option){
      var button = document.createElement("button");
      button.type = "button";
      button.textContent = option.toUpperCase();

      //Add selected letter to the wordle board 
      button.addEventListener("click", function(){
        add(option);
        closeAccentPopup();
      });

      accentOptions.appendChild(button);
    });

    accentOverlay.hidden = false;
    accentPopup.hidden = false;
    closeAccentButton.focus();
  }

  if(closeAccentButton){
    closeAccentButton.addEventListener("click", closeAccentPopup);
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

    //reset spanish keyboard hold detection
    clearTimeout(holdTimer);
    heldLetter = null;
    popupOpened = false;
    if (event.detail && typeof event.detail.nextRow === "number") {
      selectRow(event.detail.nextRow);
    }
  });

  document.addEventListener("wordle:gameover", function () {
    locked = true;
    waiting = false;
  });

  document.addEventListener("keydown", function (event) {
    
    if(!accentPopup.hidden){
      event.preventDefault();
      return;
    }

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

      else if(/^[a-zñáéíóúü]$/i.test(event.key)){
        var letter = event.key.toLowerCase();

        if(!spanish){
          if (/^[a-z]$/.test(letter)) add(letter);
        }
        else{
          //Spanish mode that checks if the ketter is held
          if(locked || waiting || heldLetter || !accentPopup.hidden) return;

          heldLetter = letter;
          popupOpened = false;

          if(accentLetters[letter]){
            holdTimer = setTimeout(function(){
              openAccentPopup(letter);
            }, 500);
          }

        }
      }

    }
    
  });

  document.addEventListener("keyup", function(event){
    if(!spanish) return;

    var letter = event.key.toLowerCase();

    if(letter !== heldLetter) return;

    clearTimeout(holdTimer);

    if(!popupOpened && accentPopup.hidden){
      add(letter);
    }
    heldLetter = null;
  });

  //Adding a new on screen hold detection for the spanish accents
  var screenHoldTimer = null;
  var screenHeldButton = null;
  var ignoreNextClick = false;

  document.addEventListener("pointerdown", function(event){
    var button = event.target.closest(".keyboard-Container button");

    if(!button || !spanish || !accentPopup.hidden) return;

    var letter = button.textContent.trim().toLowerCase();

    if(!accentLetters[letter]) return;

    screenHeldButton = button;

    screenHoldTimer = setTimeout(function(){
      ignoreNextClick = true;
      openAccentPopup(letter);
    }, 500);
  });

  //stop timer when the key is released 
  document.addEventListener("pointerup", function(){
    clearTimeout(screenHoldTimer);
    screenHeldButton = null;
  });

  //cancel interrupted press
  document.addEventListener("pointercancel", function(){
    clearTimeout(screenHoldTimer);
    screenHeldButton = null;
  });

  //cancel press if pointer leaves key
  document.addEventListener("pointerout", function(event){
    if(event.target === screenHeldButton){
      clearTimeout(screenHoldTimer);
      screenHeldButton = null;
    }
  });
  
  document.addEventListener("click", function (event) {
    var button = event.target.closest(".keyboard-Container button");
    if (!button) return;
    if(!accentPopup.hidden) return;

    if(ignoreNextClick){
      ignoreNextClick = false;
      return;
    }
    var label = button.textContent.trim().toLowerCase();
    if (label === "delete") remove();

    //submitting guess so call the function
    else if(label == "enter"){
      submitGuess();
    }
    
    else if (/^[a-z]$/.test(label)){
      if(spanish || /^[a-z]$/.test(label)){
        add(label);
      }
    }
  });

  window.WordleInput = {
    getState: function () {
      return {
        rowIndex: rowIndex,
        letters: letters.slice(),
        waiting: waiting,
      };
    },
    setRow: function (index, draft, isWaiting) {
      selectRow(index);
      letters = Array.isArray(draft) ? draft.slice(0, COLUMNS) : [];
      waiting = Boolean(isWaiting);
      render();
    },
  };

  render();
})();
