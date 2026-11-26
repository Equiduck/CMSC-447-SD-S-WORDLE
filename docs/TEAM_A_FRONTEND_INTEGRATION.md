# Team C / Team A integration (isolated implementation)

The existing shared Wordle pages and scripts are unchanged. The API work lives in new, separate online pages and in Jacob's own `javascript/api-client.js`. Team C communicates ONLY with Team A's backend, never directly with Team B.

## Pages

- `online.html` — login, server settings, invite creation/join, matchmaking, queue cancellation, resume, and logout.
- `online-game.html` — waiting room, invitation ID/link sharing, cancellation by host, server-authoritative game board and turn/status updates.
- `javascript/online-lobby.js` and `javascript/online-game.js` — controllers for those standalone pages.
- `styles/online.css` — standalone styling using Team C's existing gray/serif/rounded-button appearance.
- `javascript/api-client.js` — Team A API wrapper, session and game-ID tracking.
- `tests/api-client.test.js` — dependency-free API client regression tests.

**No existing teammate-owned pages or scripts are modified** relative to the original `api-mixin` work. To avoid changing the shared start screen, online play is accessed at `online.html` directly, rather than through a new button on `StartScreen.html`.

## Try it

1. Run Team A's Flask backend and configure its Supabase environment.
2. Serve the repository's static files using a web server.
3. Navigate to `/online.html`, enter Team A's backend URL, and log in with an existing account.
4. Create a game to open `online-game.html` and share the game ID (or a link to `online.html?invite=GAME_ID`).
5. Open the online lobby in another browser session, log in with a second account, and join using the UUID.
6. The first player's waiting room will update from Team A's `GET /games/{id}` response. Reload the game page to test reconnection.
7. Quick Match checks `POST/GET/DELETE /games/match` and can recover a queued account.

## Remaining Team A dependencies

- Guess submission is not implemented in the checked-in Team A backend. Online pages intentionally do not simulate guesses.
- Team A account creation, game history, and language-setting endpoints are also pending. The online lobby's language is the logged-in user's backend preference.
- A browser origin different from Flask needs CORS support from Team A or a same-origin reverse proxy. This cannot be fixed in frontend JavaScript.
- Team C's API client tests use mock responses; real Flask, Supabase, and browser integration still require testing.

Run automated tests using: `node --test tests/api-client.test.js`
