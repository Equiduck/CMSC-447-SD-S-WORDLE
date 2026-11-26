// Run: node --test tests/api-client.test.js
// No external dependencies or live Supabase credentials are needed.
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const source = fs.readFileSync(path.join(__dirname, "..", "javascript", "api-client.js"), "utf8");
const UUID = "11111111-2222-3333-4444-555555555555";
const AUTH = {
  user_id: "player-a",
  username: "alice",
  access_token: "test-token",
  refresh_token: "refresh-token",
  expires_at: 4102444800,
};
const STARTED = {
  game_id: UUID,
  status: "started",
  created_at: "2026-11-25T12:00:00Z",
  ended_at: null,
  language: "eng",
  players: [
    { player_id: "player-a", username: "alice", turn_order: 1, result: null },
    { player_id: "player-b", username: "bob", turn_order: 2, result: null },
  ],
  guesses: [
    { attempt_num: 1, player_id: "player-a", word: "berry", feedback: "gybbb", made_at: "2026-11-25T12:01:00Z" },
  ],
  current_turn: "player-b",
};

function harness(routes = {}) {
  const stored = new Map();
  const calls = [];
  const window = {
    localStorage: {
      getItem: key => stored.has(key) ? stored.get(key) : null,
      setItem: (key, value) => stored.set(key, String(value)),
      removeItem: key => stored.delete(key),
    },
    fetch: async (url, options) => {
      const pathname = url.replace("http://127.0.0.1:5000", "");
      calls.push({ pathname, options });
      const response = routes[pathname];
      if (!response) throw new Error("Mock did not supply " + pathname);
      const status = response.status || 200;
      return {
        ok: status >= 200 && status < 300,
        status,
        text: async () => JSON.stringify(response.body === undefined ? null : response.body),
      };
    },
  };
  vm.runInNewContext(source, { window, Date, Promise, Number, String, Boolean, Error, JSON, encodeURIComponent });
  const api = window.WordleApi;
  api.configure("http://127.0.0.1:5000");
  return { api, calls, stored };
}

test("login stores Team A session, uses bearer authentication for subsequent requests", async () => {
  const h = harness({
    "/users/login": { body: AUTH },
    ["/games/" + UUID]: { body: STARTED },
  });
  const session = await h.api.login({ username: "alice", password: "secret" });
  assert.equal(session.username, "alice");
  assert.equal(h.api.isAuthenticated(), true);
  const state = await h.api.getGame(UUID);
  assert.equal(state.currentPlayer.username, "bob");
  assert.equal(state.guesses[0].feedback, "gybbb");
  assert.equal(h.calls[0].options.headers.Authorization, undefined);
  assert.equal(h.calls[1].options.headers.Authorization, "Bearer test-token");
});

test("create and join use Team A's actual status fields", async () => {
  const h = harness({
    "/users/login": { body: AUTH },
    "/games": { status: 201, body: { game_id: UUID, status: "waiting", language: "eng" } },
    ["/games/" + UUID + "/join"]: { body: { game_id: UUID, status: "started", turn_order: 2 } },
  });
  await h.api.login({ username: "alice", password: "secret" });
  const created = await h.api.createGame();
  assert.equal(created.status, "waiting");
  assert.equal(h.api.getSavedGameId(), UUID);
  const joined = await h.api.joinGame(UUID);
  assert.equal(joined.status, "started");
  assert.equal(joined.turnOrder, 2);
});

test("reconnect gets existing Team A game state without calling join again", async () => {
  const h = harness({
    "/users/login": { body: AUTH },
    "/games": { body: { game_id: UUID, status: "waiting", language: "eng" } },
    ["/games/" + UUID]: { body: STARTED },
  });
  await h.api.login({ username: "alice", password: "secret" });
  await h.api.createGame();
  const state = await h.api.resumeGame();
  assert.equal(state.status, "started");
  assert.equal(h.calls.filter(c => c.pathname.endsWith("/join")).length, 0);
  assert.equal(h.calls.filter(c => c.pathname === "/games/" + UUID).length, 1);
});

test("a missing saved game is cleared and matchmaking can recover an active game", async () => {
  const h = harness({
    "/users/login": { body: AUTH },
    "/games": { body: { game_id: UUID, status: "waiting" } },
    ["/games/" + UUID]: { status: 404, body: { error: "Game not found" } },
    "/games/match": { body: { queued: false, game_id: null } },
  });
  await h.api.login({ username: "alice", password: "secret" });
  await h.api.createGame();
  assert.equal(await h.api.resumeGame(), null);
  assert.equal(h.api.getSavedGameId(), null);
});

test("cancel invitation and signout clear persisted game state", async () => {
  const h = harness({
    "/users/login": { body: AUTH },
    "/games": { body: { game_id: UUID, status: "waiting" } },
    ["/games/" + UUID]: { status: 204 },
  });
  await h.api.login({ username: "alice", password: "secret" });
  await h.api.createGame();
  await h.api.cancelGame(UUID);
  assert.equal(h.api.getSavedGameId(), null);
  await h.api.createGame();
  h.api.clearSession();
  assert.equal(h.api.isAuthenticated(), false);
  assert.equal(h.api.getSavedGameId(), null);
});

test("unauthenticated requests fail before hitting the network", async () => {
  const h = harness();
  await assert.rejects(h.api.getGame(UUID), error => error.status === 401);
  assert.equal(h.calls.length, 0);
});
