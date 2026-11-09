//Result dialog.
(function () {
  "use strict";

  var overlay = document.getElementById("game-result");
  var icon = document.getElementById("game-result-icon");
  var title = document.getElementById("game-result-title");
  var message = document.getElementById("game-result-message");
  var answer = document.getElementById("game-result-answer");
  var newGame = document.getElementById("new-game-button");

  if (!overlay || !icon || !title || !message || !answer || !newGame) return;

  function showResult(event) {
    var detail = event.detail || {};
    var won = detail.outcome === "win";
    var cpuWon = detail.winner === "cpu";
    var guesses = Number(detail.guesses) || 0;

    overlay.dataset.result = won ? "win" : "loss";
    icon.textContent = won ? "★" : "☆";
    title.textContent = won
      ? "Congratulations!"
      : cpuWon
        ? "CPU wins!"
        : "Thanks for playing today!";
    message.textContent = won
      ? "You solved it in " + guesses + " " + (guesses === 1 ? "guess" : "guesses") + "."
      : cpuWon
        ? "The CPU solved it in " + guesses + " guesses."
        : "You're out of guesses.";
    answer.textContent = detail.answer ? "The word was " + detail.answer.toUpperCase() + "." : "";
    answer.hidden = !detail.answer;
    overlay.hidden = false;
    document.body.classList.add("game-result-open");
    window.setTimeout(function () {
      newGame.focus();
    }, 0);
  }

  document.addEventListener("wordle:gameover", showResult);
  newGame.addEventListener("click", function () {
    newGame.disabled = true;
    window.location.reload();
  });
})();
