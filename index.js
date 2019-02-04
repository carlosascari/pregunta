/*!
* pregunta
* Copyright(c) 2015-2019 Carlos Ascari Gutierrez Hermosillo
* MIT License
*/

const readline = require('readline');
const async = require('async');
const format = require('util').format;

const p = module.exports = {};

const DEFAULT_PARSER = x => x;

const questions = [];
const answers = [];

const reader = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function toQuestionnaire (q) {
  const ret = {}
  for (let u = 0; u < q.length; u++)  {
    const o = q[u];
    if (o.var) {
      ret[o.var] = o.answer;
    } else {
      ret[o.question] = o.answer;
    }
  }
  return ret;
}

p.ask = function(question, fallback, validation) {
  questions.push({
    question: question,
    fallback: fallback,
    validation: validation
  });
  return p;
};

p.yn = function(question, fallback) {
  fallback = (!!fallback) ? 'yes' : 'no';
  questions.push({
    question: question,
    fallback: fallback,
    parser: function(answer) {
      return /^y/.test(answer) ? true : false;
    },
    validation: function(answer) {
      return /^[yn][eo]?[so]*$/i.test(answer);
    }
  });
  return p;
};

p.choose = function(question, choices, fallback) {
  if (!Array.isArray(choices)) {
    throw new Error('Invalid input: `choices` must be an Array of Strings');
  }

  if (typeof fallback === 'number') {
    if (choices[fallback] === -1) {
      fallback = choices[0];
    } else {
      fallback = choices[fallback];
    }
  } else if (typeof fallback === 'string') {
    if (choices.indexOf(fallback) !== -1) {
      fallback = choices[choices.indexOf(fallback)];
    } else {
      fallback = choices[0];
    }
  } else {
    fallback = null;
  }

  questions.push({
    question: question,
    fallback: fallback,
    validation: function(answer) {
      return choices.indexOf(answer.trim()) !== -1
    }
  });
  return p;
};

p.default = function(fallback) {
  var count = questions.length
  if (count) {
    questions[count - 1].fallback = fallback
  }
  return p;
};

p.validate = function(validator) {
  var count = questions.length
  if (count) {
    if (typeof validator === 'function') {
      questions[count - 1].validation = validator
    } else if (validator instanceof RegExp) {
      questions[count - 1].validation = function(answer) {
        return validator.test(answer);
      }
    }
  }
  return p;
};

p.invalid = function(message)  {
  var count = questions.length
  if (count) {
    var invalid = message
    if (typeof invalid === 'function') {
      questions[count - 1].invalid = invalid
    } else if (typeof invalid === 'string') {
      questions[count - 1].invalid = function(answer) {
        var ret = invalid || 'invalid input';
        if (ret.indexOf('%') !== -1) {
          return format(ret, answer);
        } else {
          return ret;
        }
      };
    }
  }
  return p;
};

p.var = function(varName) {
  if (questions.length) {
    questions[questions.length - 1].var = varName;
  }
  return p;
};

p.say = function(message) {
  var count = questions.length
  if (count) {
    if (questions[count - 1].pre) {
      questions[count - 1].pre += message + '\n';
    } else {
      questions[count - 1].pre = message;
    }
  } else {
    console.log(message || '');
  }
  return p;
};

p.done = function(callback) {
  async.whilst(
    function Test() {
      return questions.length;
    },
    function Iterate(next) {
      const qObject = questions.shift();
      const question = qObject.question  || '';
      const fallback = (qObject.fallback) ? format(' (%s)', qObject.fallback) : '';
      const validation = qObject.validation
      const invalid = qObject.invalid || '';
      const parser = qObject.parser || DEFAULT_PARSER;
      const pre = qObject.pre || '';
      const prompt = format('%s:%s ', question, fallback);
      reader.once(
        'line', 
        function(line)  {
          line = line.trim();
          if (!line.length) {
            if (qObject.fallback) {
              qObject.answer = parser(qObject).fallback;
              answers.push(qObject);
              next(null);
            } else {
              if (validation) {
                if (validation(line)) {
                  qObject.answer = parser(line);
                  answers.push(qObject);
                  next(null);
                } else {
                  if (invalid) console.log(invalid(line));
                  questions.unshift(qObject);
                  next(null);
                }
              } else {
                console.log('not optional');
                questions.unshift(qObject);
                next(null);
              }
            }
          } else {
            if (validation) {
              if (validation(line)) {
                qObject.answer = parser(line);
                answers.push(qObject);
                next(null);
              } else {
                if (invalid) console.log(invalid(line));
                questions.unshift(qObject);
                next(null);
              }
            } else {
              qObject.answer = parser(line);
              answers.push(qObject);
              next(null);
            }
          }
        }
      )
      reader.resume();
      if (pre) console.log(pre);
      reader.setPrompt(prompt);
      reader.prompt();
    },
    function Done(error) {
      reader.pause();
      callback(error, toQuestionnaire(answers));
      questions.length = 0;
      answers.length = 0;
    }
  )
};