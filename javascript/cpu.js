//Local CPU opponent for testing.
(function (global) {
  "use strict";

  var words = global.WORDLE_WORDS || { answers: [], allowed: [] };
  var ENGLISH = { answers: words.answers || [], allowed: words.allowed || [] };
  var SPANISH = words.spanish || ENGLISH;
  var YELLOW_WEIGHT = 2;
  var GRAY_WEIGHT = 1;
  var QUALITY_BIAS = 100;
  var DIFFICULTY_SOFT_FLOORS = {
    medium: 80,
    easy: 65,
  };

  function normalizeLanguage(language) {
    return language === "spanish" || language === "es" ? "spanish" : "english";
  }

  function dictionaryFor(language) {
    return normalizeLanguage(language) === "spanish" ? SPANISH : ENGLISH;
  }

  //Green first, then yellow using only remaining letters.
  function evaluate(guess, answer) {
    var result = [];
    var guessUsed = [];
    var answerUsed = [];
    var i;
    var j;
    for (i = 0; i < answer.length; i += 1) {
      result[i] = "absent";
      guessUsed[i] = false;
      answerUsed[i] = false;
    }
    for (i = 0; i < guess.length; i += 1) {
      if (guess[i] === answer[i] && !answerUsed[i]) {
        result[i] = "correct";
        guessUsed[i] = true;
        answerUsed[i] = true;
      }
    }
    for (i = 0; i < guess.length; i += 1) {
      if (guessUsed[i]) continue;
      for (j = 0; j < answer.length; j += 1) {
        if (!answerUsed[j] && guess[i] === answer[j]) {
          result[i] = "present";
          answerUsed[j] = true;
          break;
        }
      }
    }
    return result;
  }

  function isValidGuess(word, language) {
    var dictionary = dictionaryFor(language);
    return dictionary.answers.indexOf(word) !== -1 || dictionary.allowed.indexOf(word) !== -1;
  }

  function normalizeDifficulty(difficulty) {
    return difficulty === "medium" || difficulty === "easy" ? difficulty : "hard";
  }

  function createGame(language, difficulty) {
    var selectedLanguage = normalizeLanguage(language);
    var dictionary = dictionaryFor(selectedLanguage);
    return {
      answer: dictionary.answers[Math.floor(Math.random() * dictionary.answers.length)],
      guesses: [],
      feedback: [],
      language: selectedLanguage,
      difficulty: normalizeDifficulty(difficulty),
      used: {},
    };
  }

  //Record a guess and return its feedback.
  function record(game, guess) {
    var feedback = evaluate(guess, game.answer);
    game.guesses.push(guess);
    game.feedback.push(feedback);
    game.used[guess] = true;
    return feedback;
  }

  //Recreate feedback to validate a possible answer.
  function matches(candidate, guess, feedback) {
    var actual = evaluate(guess, candidate);
    var i;
    for (i = 0; i < guess.length; i += 1) {
      if (actual[i] !== feedback[i]) return false;
    }
    return true;
  }

  function isConsistent(candidate, game) {
    for (var i = 0; i < game.guesses.length; i += 1) {
      if (!matches(candidate, game.guesses[i], game.feedback[i])) return false;
    }
    return true;
  }

  //Green clues are absolute. Yellow/gray clues produce a percentage score.
  function softMatchPercent(candidate, game) {
    var weightedMatches = 0;
    var weightedTotal = 0;

    for (var row = 0; row < game.guesses.length; row += 1) {
      var candidateFeedback = evaluate(game.guesses[row], candidate);
      for (var column = 0; column < game.feedback[row].length; column += 1) {
        var state = game.feedback[row][column];
        if (state === "correct") {
          if (candidateFeedback[column] !== "correct") return null;
          continue;
        }

        var weight = state === "present" ? YELLOW_WEIGHT : GRAY_WEIGHT;
        weightedTotal += weight;
        if (candidateFeedback[column] === state) weightedMatches += weight;
      }
    }

    return weightedTotal === 0 ? 100 : Math.round(weightedMatches * 100 / weightedTotal);
  }

  function randomChoice(pool) {
    return pool[Math.floor(Math.random() * pool.length)];
  }

  function weightedChoice(pool, weights) {
    var total = 0;
    for (var i = 0; i < weights.length; i += 1) total += weights[i];

    var target = Math.random() * total;
    for (var j = 0; j < pool.length; j += 1) {
      target -= weights[j];
      if (target <= 0) return pool[j];
    }
    return pool[pool.length - 1];
  }

  function thresholdFor(game) {
    var difficulty = normalizeDifficulty(game.difficulty);
    return DIFFICULTY_SOFT_FLOORS[difficulty];
  }

  function chooseSoftGuess(game, dictionary, threshold) {
    var pools = [dictionary.answers, dictionary.allowed];
    var fallback = [];
    var fallbackScore = -1;

    for (var poolIndex = 0; poolIndex < pools.length; poolIndex += 1) {
      var passing = [];
      var weights = [];
      var source = pools[poolIndex];

      for (var i = 0; i < source.length; i += 1) {
        var candidate = source[i];
        if (game.used[candidate]) continue;

        var score = softMatchPercent(candidate, game);
        if (score === null) continue;

        if (score >= threshold) {
          passing.push(candidate);
          var margin = (score - threshold) / (100 - threshold);
          weights.push(1 + QUALITY_BIAS * margin);
        }
        if (score > fallbackScore) {
          fallbackScore = score;
          fallback = [candidate];
        } else if (score === fallbackScore) {
          fallback.push(candidate);
        }
      }

      if (passing.length > 0) return weightedChoice(passing, weights);
    }

    return fallback.length > 0 ? randomChoice(fallback) : null;
  }

  function chooseHardGuess(game, dictionary) {
    var pool = dictionary.answers.filter(function (word) {
      return !game.used[word] && isConsistent(word, game);
    });
    if (pool.length === 0) {
      pool = dictionary.allowed.filter(function (word) {
        return !game.used[word] && isConsistent(word, game);
      });
    }
    if (pool.length === 0) {
      pool = dictionary.allowed.filter(function (word) {
        return !game.used[word];
      });
    }
    if (pool.length === 0) pool = dictionary.answers;
    var guess = randomChoice(pool);
    game.used[guess] = true;
    return guess;
  }

  function chooseGuess(game) {
    var dictionary = dictionaryFor(game.language);
    var difficulty = normalizeDifficulty(game.difficulty);

    if (difficulty === "hard") return chooseHardGuess(game, dictionary);

    var guess = chooseSoftGuess(game, dictionary, thresholdFor(game));
    if (guess) {
      game.used[guess] = true;
      return guess;
    }

    return chooseHardGuess(game, dictionary);
  }

  global.WordleCpu = {
    createGame: createGame,
    chooseGuess: chooseGuess,
    evaluate: evaluate,
    isConsistent: isConsistent,
    isValidGuess: isValidGuess,
    record: record,
  };
})(typeof window !== "undefined" ? window : this);
