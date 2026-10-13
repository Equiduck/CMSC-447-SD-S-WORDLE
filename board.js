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
