//Result dialog and invalid word message.
(function () {
  "use strict";

  var overlay = document.getElementById("game-result");
  var icon = document.getElementById("game-result-icon");
  var title = document.getElementById("game-result-title");
  var message = document.getElementById("game-result-message");
  var answer = document.getElementById("game-result-answer");
  var newGame = document.getElementById("new-game-button");
  var topNewGame = document.getElementById("top-new-game-button");
  var toast = document.getElementById("game-toast");
  var toastTimer;

  if (!overlay || !icon || !title || !message || !answer || !newGame || !topNewGame || !toast) return;

  function startNewGame() {
    newGame.disabled = true;
    topNewGame.disabled = true;
    window.location.reload();
  }

  function showToast(text) {
    clearTimeout(toastTimer);
    toast.textContent = text;
    toast.dataset.visible = "true";
    toastTimer = setTimeout(function () {
      toast.dataset.visible = "false";
    }, 1500);
  }

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
    setTimeout(function () {
      newGame.focus();
    }, 0);
  }

  document.addEventListener("wordle:gameover", showResult);
  document.addEventListener("wordle:invalidguess", function (event) {
    if (event.detail && event.detail.message) showToast(event.detail.message);
  });
  document.addEventListener("keydown", function (event) {
    if (overlay.hidden || event.key === "Tab") return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (event.key === "Enter" || event.key === " ") newGame.click();
  }, true);
  newGame.addEventListener("click", startNewGame);
  topNewGame.addEventListener("click", startNewGame);
})();
