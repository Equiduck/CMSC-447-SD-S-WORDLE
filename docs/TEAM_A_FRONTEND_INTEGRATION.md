# Team C / Team A integration

Team C's browser client communicates ONLY with Team A's Flask API. Team A owns any interaction with Team B's game logic. The UI never calls Team B directly.

## Implemented in Team C

- Real Team A username/password login using POST /users/login, storing bearer tokens.
- Invitation creation and cancellation using POST /games and DELETE /games/{id}.
- Invitation joining using POST /games/{id}/join, by pasted UUID or shareable URL.
- Quick matchmaking with queue enter, poll, cancel, and queue recovery through POST/GET/DELETE /games/match.
- A styled game waiting room with invite ID, share link, player names and cancel button for the host.
- Authenticated GET /games/{id} polling, rendering actual guesses, feedback, players and current turn.
- Resume an existing game from saved ID, with a matchmaking-status fallback.
- Visible failures for login, network outages, authorization and missing games.
- Offline CPU play, unchanged.

Guessing is intentionally disabled in online play until Team A supplies its guess endpoint. The frontend never invents successful server guesses.

## Manual setup

1. Run Team A's Flask backend with its Supabase environment configured.
2. Serve Team C's HTML using a web server rather than opening file:// links.
3. Open StartScreen.html, select Server settings, and enter Team A's base URL (such as http://127.0.0.1:5000 for a local backend).
4. Log in using an existing account, then select Online Play.
5. Test inviting a second authenticated account: create a game, copy its UUID, sign in as a different user, join with the UUID, and watch the host's waiting room update.
6. Test Quick Match with two accounts, cancel the queue, and reload/revisit while queued.
7. Refresh a joined game page to confirm that the server's current state is reconstructed.

### Important browser networking limitation

If Team C's static site and Team A's Flask server use different origins, Team A must enable appropriate browser cross-origin access (including Authorization and Content-Type headers), or the project should proxy/serve both from one origin. The checked-in Team A Flask code currently contains no CORS setup.

Team A chooses online-game language from the authenticated user's saved language, not the frontend's local selection. Updating that preference requires a backend language endpoint.

## Waiting on Team A

- POST /games/{id}/guess: authoritative guesses and feedback, using Team B behind Team A.
- POST /users: account signup (front end shows an explicit unavailable state).
- POST /users/<username>/history: server-backed history.
- POST /users/edit/language: documented separately, but not implemented in the checked-in Flask routes.

## Regression tests

Run: node --test tests/api-client.test.js

The tests mock Team A responses; no credentials are required. They cover login/bearer auth, create/join status, reconnect, missing games, cancel, and logout. Live Flask/Supabase and browser cross-origin tests still require a running server.
