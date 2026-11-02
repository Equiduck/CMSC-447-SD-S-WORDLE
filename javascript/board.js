//Sprint one tracking player turn and status 
let typingTimer;
//Updates banner for players turn. As of right now it updates when you hit the enter key
//Later when we start working on gameplay it will be updated to end when the players turn is properly over

//updates player names using their information or keeps basic names if they are a guest
function updatePlayerNames(game){
	//.trim() is removing extra spaces from the players username if it has any
  const player1Name = game.player1?.trim() || "Player 1";
  const player2Name = game.player2?.trim() || "Player 2";

  document.getElementById("player1-name").textContent = player1Name;
  document.getElementById("player2-name").textContent = player2Name;

  //set initial turn banner to Players name 
  document.getElementById("turn-indicator").textContent = player1Name + "'s Turn";

}

//Temporary game data for testing until we have actual data from backend. This will not be in the final product 
const testGame = {
  player1: "Alice",
};
updatePlayerNames(testGame);

//Player 1 starts for temporary testing 
let currentPlayer = 1;

function updateTurnDisplay(){

	const currentName = currentPlayer === 1
		? document.getElementById("player1-name").textContent
		: document.getElementById("player2-name").textContent;

	document.getElementById("turn-indicator").textContent = currentName + "'s Turn";

	//Change player status based on whose turn it is 
	//The active player always starts as Thinking....
	if(currentPlayer == 1){

		document.getElementById("player1-status").textContent = "Thinking...";
		document.getElementById("player2-status").textContent = "Waiting...";
	}
	else{
		document.getElementById("player2-status").textContent = "Thinking...";
		document.getElementById("player1-status").textContent = "Waiting...";
	}

	//stop old timer when turn changes 
	clearTimeout(typingTimer);
}

//Called only after an accepted guess 
function advanceTurn(){
	currentPlayer = currentPlayer === 1 ? 2 : 1;
	updateTurnDisplay();
}

document.addEventListener("keydown", function(event){

		//Anyother key besides enter being pressed means they are typing 

		if(currentPlayer == 1){

			document.getElementById("player1-status").textContent = "Typing...";
			document.getElementById("player2-status").textContent = "Waiting...";
		}
		else{
			document.getElementById("player2-status").textContent = "Typing...";
			document.getElementById("player1-status").textContent = "Waiting...";
		}

		

		//Starting a 3 secound timer 
		//If 3 secounds pass and the active player doesn't touch any keys switch it to thinking 
		//The timer also gets restarted every time they touch a key 
		clearTimeout(typingTimer);

		typingTimer = setTimeout(function(){
				
			if(currentPlayer == 1){
				document.getElementById("player1-status").textContent = "Thinking...";
			}
			else{
				document.getElementById("player2-status").textContent = "Thinking...";
			}
		
		}, 3000);
	});

updateTurnDisplay();

/**
 * Sprint 1: build the empty 6x5 grid.
 */
(function () {
  "use strict";

  /* Board dimensions. */
  var ROWS = 6;
  var COLUMNS = 5;

  var ORDINAL_SUFFIXES = ["th", "st", "nd", "rd"];

  function ordinal(value) {
    var remainder = value % 100;
    var suffix =
      ORDINAL_SUFFIXES[(remainder - 20) % 10] ||
      ORDINAL_SUFFIXES[remainder] ||
      ORDINAL_SUFFIXES[0];
    return value + suffix;
  }

  function createTile(column) {
    var tile = document.createElement("div");
    tile.className = "tile";
    tile.setAttribute("data-state", "empty");
    tile.setAttribute("data-animation", "idle");
    tile.setAttribute("data-testid", "tile");
    tile.setAttribute("role", "img");
    tile.setAttribute("aria-roledescription", "tile");
    tile.setAttribute("aria-label", ordinal(column + 1) + " letter, empty");
    return tile;
  }

  function createRow(rowIndex) {
    var row = document.createElement("div");
    row.className = "row";
    row.setAttribute("role", "group");
    row.setAttribute("aria-label", "Row " + (rowIndex + 1));
    row.style.gridTemplateColumns = "repeat(" + COLUMNS + ", 1fr)";

    for (var column = 0; column < COLUMNS; column ++) {
      var wrapper = document.createElement("div");
      wrapper.className = "tile-wrapper";
      wrapper.appendChild(createTile(column));
      row.appendChild(wrapper);
    }
    return row;
  }

  var board = document.getElementById("board");
  if (!board) return;

  for (var rowIndex = 0; rowIndex < ROWS; rowIndex ++) {
    board.appendChild(createRow(rowIndex));
  }
})();
