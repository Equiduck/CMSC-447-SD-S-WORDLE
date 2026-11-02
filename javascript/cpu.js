//Local CPU opponent for testing.
(function (global) {
  "use strict";

  var words = global.WORDLE_WORDS || { answers: [], allowed: [] };
  var ENGLISH = { answers: words.answers || [], allowed: words.allowed || [] };
  var SPANISH = words.spanish || ENGLISH;

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

  function createGame(language) {
    var selectedLanguage = normalizeLanguage(language);
    var dictionary = dictionaryFor(selectedLanguage);
    return {
      answer: dictionary.answers[Math.floor(Math.random() * dictionary.answers.length)],
      guesses: [],
      feedback: [],
      language: selectedLanguage,
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

  //Prefer possible answers, then other allowed words.
  function chooseGuess(game) {
    var dictionary = dictionaryFor(game.language);
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
    var guess = pool[Math.floor(Math.random() * pool.length)];
    game.used[guess] = true;
    return guess;
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
