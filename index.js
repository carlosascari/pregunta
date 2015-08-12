/**
* Provides pregunta module, as a singleton
*
* @module pregunta
*/
var exports = module.exports = {}
var readline = require('readline')
var async = require('async')
var format = require('util').format

/**
* Line reader used to get input
*
* @property reader
* @type Object
* @private
*/
var reader = readline.createInterface({
	input: process.stdin, output: process.stdout
})

/**
* Questions being asked
*
* @property QUESTIONS
* @type Array
* @private
*/
var QUESTIONS = []

/**
* Answers (where question objects go after they receive an answer)
*
* @property QUESTIONS
* @type Array
* @private
*/
var ANSWERS = []

/**
* Convert array of question objects into an object where keys are the 
* questions, and the values are the ansers to thsoe questions.
*
* @method toQuestionnaire
* @param q {Array} of question objects (used internally)
/ @return Object
* @private
*/
function toQuestionnaire (q) 
{
	var ret = {}
	for (var u = 0; u < q.length; u++) 
	{
		var o = q[u]
		ret[o.question] = o.answer
	}
	return ret
}

/**
* Chain method generator
*
* Itself forms a chain, created so i don't have to type 
* return this over and over again.
*
* @method chained
* @param {Object} `this` object to always return
* @param {String} name of method [optional]
* @param {Function} Method to chain
* @private
*/
function chained (obj, name, method) 
{
	var argc = arguments.length
	if (arguments.length === 1)
	{
		return { 
			chain: function chain(name, method) 
			{
				if (arguments.length === 1)
				{
					method = name, name = method.name || 'unnamed'
				}
				return chained(obj, name, method)
			}
		}
	}
	else if (arguments.length === 2)
	{
		method = name, name = (method.name || 'unnamed')
	}
	else if (arguments.length === 0)
	{
		return {chained: chained, chain: chained}
	}

	obj[name] = function () 
	{
		return method.apply(obj, arguments), obj
	}

	return {chained: chained, chain: chained}
}

/**
* Ask a general question
*
* @method ask
* @param question {String} `question to prompt/display
* @param fallback {String} default value if non is provided [optional]
* @param validation {RegExp|Function} Validation used on answers [optional]
* @public
*/
chained(exports)
.chain('ask', function (question, fallback, validation) {
	QUESTIONS.push({
		question: 	question,
		fallback: 	fallback,
		validation: validation
	})
})

/**
* Ask a yes or no question
*
* @method yn
* @param question {String} `question to prompt/display
* @param fallback {Boolean|String} default value if non is provided [optional]
* @public
*/
.chain('yn', function (question, fallback) {
	fallback = (!!fallback) ? 'yes' : 'no'
	QUESTIONS.push({
		question: 	question,
		fallback: 	fallback,
		validation: function (answer) 
		{
			return /^[yn][eo]?[so]*$/i.test(answer)
		}
	})
})

/**
* Ask user to choose one of multiple options
*
* @method choose
* @param question {String} `question to prompt/display
* @param choices {Array} 
* @param fallback {String} default value if non is provided [optional]
* @public
*/
.chain('choose', function (question, choices, fallback) {
	if (!Array.isArray(choices)) throw new Error('chioces must be an array of strings')
	fallback = (typeof fallback === 'number') 
				? (choices[fallback] === -1) 
					? (choices[0] || '')
					: (choices[fallback] || '')
				: (typeof fallback === 'string')
					? (choices.indexOf(fallback) !== -1)
						? choices[choices.indexOf(fallback)]
						: (choices[0] || '')
					: ('')

	QUESTIONS.push({
		question: 	question,
		fallback: 	fallback,
		validation: function (answer) 
		{
			return choices.indexOf(answer.trim()) !== -1
		}
	})
})

/**
* Set default answer for a question
*
* @method default
* @param fallback {String} default value if non is provided 
* @public
*/
.chain('default', function (fallback) {
	var count = QUESTIONS.length
	if (count)
	{
		QUESTIONS[count - 1].fallback = fallback
	}
	return this
})

/**
* Set validation for a correct answer
*
* @method validate
* @param validator {RegExp|Function} Validation used on answers
* @public
*/
.chain('validate', function (validator) {
	var count = QUESTIONS.length
	if (count)
	{
		if (typeof validator === 'function')
		{
			QUESTIONS[count - 1].validation = validator
		}
		else if (validator instanceof RegExp)
		{
			QUESTIONS[count - 1].validation = function (answer) {
				return validator.test(answer)
			}
		}
	}
	return this
})

/**
* Set a message to print when incorrect input is entered
*
* @method invalid
* @param message {String} to output whenever there is an incorrect answer
* @public
*/
.chain('invalid', function (message)  {
	var count = QUESTIONS.length
	if (count)
	{
		var invalid = message
		if (typeof invalid === 'function')
		{
			QUESTIONS[count - 1].invalid = invalid
		}
		else if (typeof invalid === 'string')
		{
			QUESTIONS[count - 1].invalid = function (answer) {
				var ret = invalid || 'invalid input'
				if (ret.indexOf('%') !== -1)
				{
					return format(ret, answer)
				}
				else
				{
					return ret
				}
			}
		}
	}
	return this	
})

/**
* Prepend a question, text is placed one line above the prompt
*
* @method say
* @param message {String} to output before the prompt is displayed
* @public
*/
.chain('say', function (message) {
	var count = QUESTIONS.length
	if (count)
	{
		if (QUESTIONS[count - 1].pre)
		{
			QUESTIONS[count - 1].pre += message + '\n'
		}
		else
		{
			QUESTIONS[count - 1].pre = message
		}
	}
	else
	{
		console.log(message || '')
	}
	return this
})

/**
* Start asking the questions defined, after they are all complete
* a callback is called with `null` or `Error` as the first argument and
* an object with questions as keys and the answers as values on the second
* argument if all is well.
*
* @method done
* @param callback {Function} called when all questions have been answered/skipped
*			@callback
*			@param err {null|Error}
*			@param questionnaire {Object}
* @public
*/
.chain('done', function (callback)
{
	async.whilst(
		function Test () 
		{
			return QUESTIONS.length
		},
		function Iterate (subcallback) 
		{
			var qObject 	= QUESTIONS.shift()
			var question 	= qObject.question 	|| ''
			var fallback 	= (qObject.fallback) ? format(' (%s)', qObject.fallback) : ''
			var validation 	= qObject.validation
			var invalid 	= qObject.invalid || ''
			var pre 		= qObject.pre || ''
			var prompt 		= format('%s:%s ', question, fallback)
			
			reader.once(
				'line', 
				function (line) 
				{
					line = line.trim()
					if (!line.length)
					{
						if (qObject.fallback)
						{
							qObject.answer = qObject.fallback
							ANSWERS.push(qObject)
							subcallback(null)
						}
						else
						{
							if (validation)
							{
								if (validation(line))
								{
									qObject.answer = line
									ANSWERS.push(qObject)
									subcallback(null)
								}
								else
								{

									if (invalid) console.log(invalid(line))
									QUESTIONS.unshift(qObject)
									subcallback(null)
								}
							}
							else
							{
								console.log('not optional')
								QUESTIONS.unshift(qObject)
								subcallback(null)								
							}
						}
					}
					else
					{
						if (validation)
						{
							if (validation(line))
							{
								qObject.answer = line
								ANSWERS.push(qObject)
								subcallback(null)
							}
							else
							{
								if (invalid) console.log(invalid(line))
								QUESTIONS.unshift(qObject)
								subcallback(null)
							}
						}
						else
						{
							// can be anything, cool
							qObject.answer = line
							ANSWERS.push(qObject)
							subcallback(null)
						}
					}
				}
			)
			if (pre) console.log(pre)
			reader.setPrompt(prompt)
			reader.prompt()
		},
		function Done (err) 
		{
			reader.close()
			callback(err, toQuestionnaire(ANSWERS))
			QUESTIONS = []
			ANSWERS = []
		}
	)
})
