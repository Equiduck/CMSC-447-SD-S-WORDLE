// Local CPU opponent. It owns a dictionary (words.js), picks the target for a
// new game, and chooses guesses that stay consistent with the feedback it has
// seen. Stand-in for the server-side engine Teams A and B will own.
(function (global) {
  "use strict";

  var words = global.WORDLE_WORDS || { answers: [], allowed: [] };
  var ANSWERS = words.answers;
  var ALLOWED = words.allowed;

  // Scraped Wordle semantics: greens first, then yellows that consume only the
  // still-unclaimed copies of a letter.
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

  function isValidGuess(word) {
    return ANSWERS.indexOf(word) !== -1 || ALLOWED.indexOf(word) !== -1;
  }

  function createGame() {
    return {
      answer: ANSWERS[Math.floor(Math.random() * ANSWERS.length)],
      guesses: [],
      feedback: [],
      used: {},
    };
  }

  // Records a guess (by either player) and returns its feedback.
  function record(game, guess) {
    var feedback = evaluate(guess, game.answer);
    game.guesses.push(guess);
    game.feedback.push(feedback);
    game.used[guess] = true;
    return feedback;
  }

  function letterCounts(word) {
    var counts = {};
    for (var i = 0; i < word.length; i += 1) {
      counts[word[i]] = (counts[word[i]] || 0) + 1;
    }
    return counts;
  }

  // True when a candidate could have produced this feedback.
  function matches(candidate, guess, feedback) {
    var i;
    for (i = 0; i < guess.length; i += 1) {
      if (feedback[i] === "correct" && candidate[i] !== guess[i]) return false;
    }
    var counts = letterCounts(candidate);
    var info = {};
    for (i = 0; i < guess.length; i += 1) {
      var letter = guess[i];
      info[letter] = info[letter] || { correct: 0, present: 0, absent: 0 };
      info[letter][feedback[i]] += 1;
    }
    for (var key in info) {
      if (!Object.prototype.hasOwnProperty.call(info, key)) continue;
      var matched = info[key].correct + info[key].present;
      var have = counts[key] || 0;
      if (matched === 0 && have !== 0) return false;
      if (matched > 0 && info[key].absent > 0 && have !== matched) return false;
      if (matched > 0 && info[key].absent === 0 && have < matched) return false;
    }
    return true;
  }

  function consistent(candidate, game) {
    for (var i = 0; i < game.guesses.length; i += 1) {
      if (!matches(candidate, game.guesses[i], game.feedback[i])) return false;
    }
    return true;
  }

  // Prefers words that are also possible answers, then any dictionary word.
  function chooseGuess(game) {
    var pool = ANSWERS.filter(function (word) {
      return !game.used[word] && consistent(word, game);
    });
    if (pool.length === 0) {
      pool = ALLOWED.filter(function (word) {
        return !game.used[word] && consistent(word, game);
      });
    }
    if (pool.length === 0) {
      pool = ALLOWED.filter(function (word) {
        return !game.used[word];
      });
    }
    if (pool.length === 0) pool = ANSWERS;
    var guess = pool[Math.floor(Math.random() * pool.length)];
    game.used[guess] = true;
    return guess;
  }

  global.WordleCpu = {
    createGame: createGame,
    chooseGuess: chooseGuess,
    evaluate: evaluate,
    isValidGuess: isValidGuess,
    record: record,
  };
})(typeof window !== "undefined" ? window : this);
