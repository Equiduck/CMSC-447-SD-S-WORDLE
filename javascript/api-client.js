//Team A API client. Team C communicates only with Team A; Team A owns Team B integration.
(function (global) {
  "use strict";

  var BASE_URL_KEY = "shared-wordle-api-base-url";
  var SESSION_KEY = "shared-wordle-api-session";
  var GAME_ID_KEY = "shared-wordle-api-game-id";

  function ApiError(message, status, body) {
    this.name = "ApiError";
    this.message = message;
    this.status = status;
    this.body = body;
  }
  ApiError.prototype = Object.create(Error.prototype);

  function storageGet(key) {
    try {
      return global.localStorage.getItem(key);
    } catch (error) {
      return null;
    }
  }

  function storageSet(key, value) {
    try {
      global.localStorage.setItem(key, value);
    } catch (error) {
      //Keep working for this page when storage is unavailable.
    }
  }

  function storageRemove(key) {
    try {
      global.localStorage.removeItem(key);
    } catch (error) {
      //Keep working for this page when storage is unavailable.
    }
  }

  function configure(baseUrl) {
    var normalized = String(baseUrl || "").replace(/\/+$/, "");
    if (normalized && !/^https?:\/\/[^/]+/i.test(normalized)) {
      throw new ApiError("API base URL must use HTTP or HTTPS.", 0, null);
    }
    storageSet(BASE_URL_KEY, normalized);
    return normalized;
  }

  function getBaseUrl() {
    return storageGet(BASE_URL_KEY) || "";
  }

  function getSession() {
    try {
      return JSON.parse(storageGet(SESSION_KEY)) || null;
    } catch (error) {
      return null;
    }
  }

  function getSavedGameId() {
    return storageGet(GAME_ID_KEY);
  }

  function rememberGameId(gameId) {
    if (gameId) storageSet(GAME_ID_KEY, String(gameId));
    return gameId;
  }

  function clearSavedGameId() {
    storageRemove(GAME_ID_KEY);
  }

  function saveSession(session) {
    var previous = getSession();
    if (previous && previous.user_id !== session.user_id) clearSavedGameId();
    var saved = {
      user_id: session.user_id,
      username: session.username,
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      expires_at: session.expires_at,
    };
    storageSet(SESSION_KEY, JSON.stringify(saved));
    return saved;
  }

  function clearSession() {
    storageRemove(SESSION_KEY);
    clearSavedGameId();
  }

  function sessionExpiration(session) {
    if (!session || session.expires_at === undefined || session.expires_at === null) {
      return null;
    }

    var value = session.expires_at;
    var numeric = Number(value);
    if (value !== "" && !Number.isNaN(numeric)) {
      return numeric < 1000000000000 ? numeric * 1000 : numeric;
    }

    var parsed = Date.parse(value);
    return Number.isNaN(parsed) ? null : parsed;
  }

  function isSessionExpired(session) {
    var expiration = sessionExpiration(session);
    return expiration !== null && Date.now() >= expiration;
  }

  function isAuthenticated() {
    var session = getSession();
    return Boolean(session && session.access_token) && !isSessionExpired(session);
  }

  function request(path, options) {
    var requestOptions = options || {};
    var baseUrl = getBaseUrl();
    var session = getSession();
    var headers = { Accept: "application/json" };
    var body = requestOptions.body;

    if (!baseUrl) {
      return Promise.reject(new ApiError("API base URL is not configured.", 0, null));
    }
    if (!/^https?:\/\/[^/]+/i.test(baseUrl)) {
      return Promise.reject(new ApiError("API base URL must use HTTP or HTTPS.", 0, null));
    }

    if (requestOptions.auth !== false) {
      if (!session || !session.access_token) {
        return Promise.reject(new ApiError("Authentication required.", 401, null));
      }
      if (isSessionExpired(session)) {
        return Promise.reject(new ApiError("Authentication session expired.", 401, null));
      }
      headers.Authorization = "Bearer " + session.access_token;
    }
    if (body !== undefined) {
      headers["Content-Type"] = "application/json";
      body = JSON.stringify(body);
    }

    var networkRequest;
    try {
      networkRequest = global.fetch(baseUrl + path, {
        method: requestOptions.method || "GET",
        headers: headers,
        body: body,
      });
    } catch (error) {
      return Promise.reject(new ApiError("Unable to reach the API.", 0, null));
    }

    return networkRequest.catch(function () {
      throw new ApiError("Unable to reach the API.", 0, null);
    }).then(function (response) {
      if (response.status === 204) return null;

      return response.text().then(function (text) {
        var data = text;
        try {
          data = text ? JSON.parse(text) : null;
        } catch (error) {
          //Return non-JSON responses as text.
        }
        if (!response.ok) {
          throw new ApiError(
            (data && (data.error || data.message)) || "API request failed.",
            response.status,
            data,
          );
        }
        return data;
      });
    });
  }

  function normalizeGame(game) {
    if (!game) return null;

    var rawPlayers = (game.players || []).slice().sort(function (left, right) {
      return left.turn_order - right.turn_order;
    });
    var players = rawPlayers.map(function (player) {
      return {
        playerId: player.player_id,
        username: player.username,
        turnOrder: player.turn_order,
        result: player.result,
      };
    });
    var currentPlayer = players.find(function (player) {
      return player.playerId === game.current_turn;
    }) || null;

    return {
      gameId: game.game_id,
      status: game.status,
      createdAt: game.created_at,
      endedAt: game.ended_at || null,
      language: game.language,
      players: players,
      currentTurnId: game.current_turn,
      currentPlayer: currentPlayer,
      guesses: (game.guesses || []).map(function (guess) {
        return {
          attemptNumber: guess.attempt_num,
          playerId: guess.player_id,
          word: guess.word,
          feedback: guess.feedback,
          madeAt: guess.made_at,
        };
      }),
      answer: game.answer || null,
      raw: game,
    };
  }

  function login(credentials) {
    return request("/users/login", {
      method: "POST",
      auth: false,
      body: credentials,
    }).then(saveSession);
  }

  function createGame(payload) {
    return request("/games", {
      method: "POST",
      body: payload,
    }).then(function (game) {
      rememberGameId(game.game_id);
      return {
        gameId: game.game_id,
        status: game.status,
        language: game.language,
        raw: game,
      };
    });
  }

  function getGame(gameId) {
    return request("/games/" + encodeURIComponent(gameId)).then(normalizeGame).then(function (game) {
      rememberGameId(game.gameId);
      return game;
    });
  }

  function joinGame(gameId, payload) {
    return request("/games/" + encodeURIComponent(gameId) + "/join", {
      method: "POST",
      body: payload,
    }).then(function (game) {
      rememberGameId(game.game_id);
      return {
        gameId: game.game_id,
        status: game.status,
        turnOrder: game.turn_order,
        raw: game,
      };
    });
  }

  function cancelGame(gameId) {
    return request("/games/" + encodeURIComponent(gameId), { method: "DELETE" }).then(function (result) {
      if (getSavedGameId() === String(gameId)) clearSavedGameId();
      return result;
    });
  }

  function rememberMatch(result) {
    if (result && result.game_id) rememberGameId(result.game_id);
    return result;
  }

  function joinMatchmaking() {
    return request("/games/match", { method: "POST" }).then(rememberMatch);
  }

  function getMatchmaking() {
    return request("/games/match").then(rememberMatch);
  }

  function leaveMatchmaking() {
    return request("/games/match", { method: "DELETE" });
  }

  // Reconnect only to an existing Team A game. Do not call /join again:
  // Team A rejects joining a game that has already started.
  function resumeGame() {
    function findStartedMatch() {
      return getMatchmaking().then(function (result) {
        return result && result.game_id ? getGame(result.game_id) : null;
      });
    }

    var gameId = getSavedGameId();
    if (!gameId) return findStartedMatch();
    return getGame(gameId).then(function (game) {
      if (game.status === "waiting" || game.status === "started") return game;
      clearSavedGameId();
      return findStartedMatch();
    }).catch(function (error) {
      if (error.status !== 403 && error.status !== 404) throw error;
      clearSavedGameId();
      return findStartedMatch();
    });
  }

  global.WordleApi = {
    ApiError: ApiError,
    cancelGame: cancelGame,
    clearSession: clearSession,
    clearSavedGameId: clearSavedGameId,
    configure: configure,
    createGame: createGame,
    getBaseUrl: getBaseUrl,
    getGame: getGame,
    getMatchmaking: getMatchmaking,
    getSession: getSession,
    getSavedGameId: getSavedGameId,
    isAuthenticated: isAuthenticated,
    isSessionExpired: isSessionExpired,
    joinGame: joinGame,
    joinMatchmaking: joinMatchmaking,
    leaveMatchmaking: leaveMatchmaking,
    login: login,
    normalizeGame: normalizeGame,
    request: request,
    resumeGame: resumeGame,
    saveSession: saveSession,
  };
})(window);
