# pregunta

Hassle free CLI input.

Slim chainable library, when you need something like `npm init`, to interactively gather input.

## installation

    npm i pregunta --save

## usage

**Example: npm init**

```js
var pregunta = require('pregunta')

pregunta
.say('This utility will walk you through creating a package.json file.')
.say('It only covers the most common items, and tries to guess sane defaults.')
.say('')
.say('See `npm help json` for definitive documentation on these fields')
.say('and exactly what they do.')
.say('')
.say('Use `npm install <pkg> --save` afterwards to install a package and')
.say('save it as a dependency in the package.json file.')
.say()
.say('Press ^C at any time to quit.')
.ask('name').validate(function(answer){
    return ['.', '_'].indexOf(answer.trim()[0]) === -1
})
.ask('version').default('1.0.0')
.ask('description')
.ask('entry point').default('index.js')
.ask('test command')
.ask('git repository')
.ask('keywords')
.ask('license').default('ISC')
.done(function (questionnaire) {
    console.log(questionnaire)
})
```

**Note**: Use `.var('variableName')` to specify the name of the variable to hold the answer, otherwise the question itself will be the name of the variable.

**Yes or No questions**

You can use the `yn` method to ask yes/no questions. The second argument if set becomes the default value

```javascript
var pregunta = require('pregunta')
pregunta
    .yn('would you like to continue?', true)
    .done(function(err, questionnaire){
        console.log(
            'answer was: %s',
            questionnaire['would you like to continue?']
        )
    })
```

**Choices**

You can use the `choose` to ask for a choice. The third argument is the default, it can be either a string or an index.

```javascript
var pregunta = require('pregunta')
pregunta
    .choose('choose a color:', ['red', 'green', 'blue'], 'green')
    .done(function(err, questionnaire){
        console.log(
            'your choice was: %s',
            questionnaire['choose a color:']
        )
    })
```

**Validation**

The `validate` method can be use to set validation for input. The value can be either a **RegExp** to test the answer or a **Function** that receives the answer as the first argument and must return either true or false. Note that the `ask` method can accept validation as the third argument or you can simply append a `validate` method to set the validation.

The `invalid` method sets a message to print out when the validation fails. It can be a **String**,  where if it contains a `%s` character, it will be replaced with the erroneous answer given. Its value can also be a **Function** whose first argument will be the erroneous answer and must return a string to print out or a falsy value to not print out a message.

```javascript
var pregunta = require('pregunta')
var REG_EMAIL = /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/i
pregunta
    .ask('email', 'example@gmail.com', REG_EMAIL)
    .validate(REG_EMAIL)
    .invalid('\n [!] `%s` is not a valid email!\n')
    .done(function(err, questionnaire){
        console.log(
            'your email was: %s',
            questionnaire['email']
        )
    })
```

**Prompt**

The `say` method is used to print out messages. The message *piggybacks* the last question asked and appears beforehand, i.e before the prompt is shown for that question

```javascript
var pregunta = require('./index')
var pokemon = ['pikachu', 'bulbasaur', 'charmander']
var statement = 'choose a pokemon:\n\n\t' + pokemon.join('\n\t') + '\n\n'
  pregunta
      .say('Your life depends on this')
      .say(statement)
      .choose('pokemon', pokemon, 'charmander')
      .invalid('\nnoo! your answer `%s` is invalid!\n')
      .done(function(err, questionnaire){
          console.log(
              'your pokemon is: %s',
              questionnaire['pokemon']
          )
      })
```

## pregunta API

### **.ask**(*question* *[*, *default*, *validation* *]*) 
**.ask**(*String*) 
**.ask**(*String*, *String*) 
**.ask**(*String*, *String*, *RegExp*) 
**.ask**(*String*, *String*, *Function*) 

### **.yn**(*question* *[*, *default* *]*) 
**.yn**(*String*) 
**.yn**(*String*, *Boolean*) 
**.yn**(*String*, *String*) 

### **.choose**(*question*, *choices* *[*, *default* *]*) 
**.choose**(*String*, *Array*) 
**.choose**(*String*, *Array*, *Number*) 
**.choose**(*String*, *Array*, *String*) 

### **.var**(*variable_name*) 
**.var**(*String*) 

### **.default**(*value*) 
**.default**(*String*) 

### **.validate**(*validation*) 
**.validate**(*RegExp*) 
**.validate**(*Function*) 

### **.invalid**(*message*) 
**.invalid**(*String*)
**.invalid**(*Function*)

### **.say**(*statement*) 
**.say**(*String*) 

### **.done**(*callback*) 
**.done**(*Function*) 

-----------------------------------

## More cats

If you're looking for something more robust check out [inquirer](https://www.npmjs.com/package/inquirer), they have a sweet collection of CLI user interfaces. 

## License

[The MIT License](http://opensource.org/licenses/MIT)