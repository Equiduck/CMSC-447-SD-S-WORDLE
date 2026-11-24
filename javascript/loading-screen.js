//Wordle-style loading screen.
(function () {
  "use strict";

  var STYLE_ID = "wordle-loading-styles";
  var LOADER_ID = "wordle-loading-screen";
  var MIN_DISPLAY_MS = 650;
  var startedAt = Date.now();
  var hiding = false;

  if (document.getElementById(LOADER_ID)) return;

  var style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = [
    "#wordle-loading-screen {",
    "  position: fixed;",
    "  inset: 0;",
    "  z-index: 10000;",
    "  box-sizing: border-box;",
    "  display: flex;",
    "  align-items: center;",
    "  justify-content: center;",
    "  min-height: 100vh;",
    "  min-height: 100dvh;",
    "  padding: max(16px, env(safe-area-inset-top)) max(12px, env(safe-area-inset-right)) max(16px, env(safe-area-inset-bottom)) max(12px, env(safe-area-inset-left));",
    "  overflow: hidden;",
    "  overscroll-behavior: contain;",
    "  touch-action: none;",
    "  -webkit-tap-highlight-color: transparent;",
    "  user-select: none;",
    "  background: var(--color-background, #fff);",
    "  color: var(--color-tone-1, #000);",
    "  opacity: 1;",
    "  transition: opacity 180ms ease-out;",
    "}",
    "#wordle-loading-screen.wordle-loading-screen--hidden {",
    "  opacity: 0;",
    "  pointer-events: none;",
    "}",
    ".wordle-loading-screen__letters {",
    "  display: flex;",
    "  max-width: calc(100vw - 24px);",
    "  justify-content: center;",
    "  gap: clamp(4px, 1.5vw, 8px);",
    "}",
    ".wordle-loading-screen__letter {",
    "  display: grid;",
    "  place-items: center;",
    "  width: clamp(38px, 12vw, 52px);",
    "  height: clamp(38px, 12vw, 52px);",
    "  border: 2px solid #787c7e;",
    "  font-family: \"nyt-franklin\", \"Helvetica Neue\", Arial, sans-serif;",
    "  font-size: clamp(22px, 7vw, 30px);",
    "  font-weight: 700;",
    "  line-height: 1;",
    "  animation: wordle-loading-bounce 900ms ease-in-out infinite;",
    "  animation-delay: var(--wordle-loading-delay);",
    "  will-change: transform;",
    "}",
    "html.wordle-loading,",
    "html.wordle-loading body {",
    "  overflow: hidden;",
    "  overscroll-behavior: none;",
    "}",
    "html[data-theme=\"dark\"] #wordle-loading-screen {",
    "  background: #000;",
    "  color: #fff;",
    "}",
    "@keyframes wordle-loading-bounce {",
    "  0%, 55%, 100% { transform: translateY(0); }",
    "  25% { transform: translateY(-18px); }",
    "  38% { transform: translateY(3px); }",
    "  46% { transform: translateY(-8px); }",
    "}",
    "@media (prefers-reduced-motion: reduce) {",
    "  .wordle-loading-screen__letter { animation: none; }",
    "}",
    "@media (max-height: 420px) and (orientation: landscape) {",
    "  .wordle-loading-screen__letter {",
    "    width: 36px;",
    "    height: 36px;",
    "    font-size: 20px;",
    "  }",
    "}",
  ].join("\n");
  document.head.appendChild(style);

  var loader = document.createElement("div");
  loader.id = LOADER_ID;
  loader.style.backgroundColor = getComputedStyle(document.documentElement).backgroundColor;
  loader.setAttribute("role", "status");
  loader.setAttribute("aria-label", "Loading Shared-State Wordle");

  var letters = document.createElement("div");
  letters.className = "wordle-loading-screen__letters";
  letters.setAttribute("aria-hidden", "true");
  "WORDLE".split("").forEach(function (letter, index) {
    var tile = document.createElement("div");
    tile.className = "wordle-loading-screen__letter";
    tile.style.setProperty("--wordle-loading-delay", (index * 90) + "ms");
    tile.textContent = letter;
    letters.appendChild(tile);
  });
  loader.appendChild(letters);
  document.documentElement.classList.add("wordle-loading");
  document.documentElement.appendChild(loader);

  function hideLoader() {
    if (hiding) return;
    hiding = true;

    var remaining = Math.max(0, MIN_DISPLAY_MS - (Date.now() - startedAt));
    window.setTimeout(function () {
      loader.classList.add("wordle-loading-screen--hidden");
      loader.setAttribute("aria-hidden", "true");
      document.documentElement.classList.remove("wordle-loading");
      window.setTimeout(function () {
        if (loader.parentNode) loader.parentNode.removeChild(loader);
      }, 220);
    }, remaining);
  }

  if (document.readyState === "complete") {
    hideLoader();
  } else {
    window.addEventListener("load", hideLoader, { once: true });
  }
  window.setTimeout(hideLoader, 4000);
})();
