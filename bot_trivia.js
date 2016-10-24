//Includes
const Discord = require('discord.js'); // discord.js
var request = require("request"); // For HTTP requests

// Bot stuff
const bot = new Discord.Client();

// Config
const token = 'YOUR-BOT-TOKEN-HERE'; // Self-explanatory
const trigger = '!quiz'; // The message to trigger the quiz
const answerTrigger = '!a'; // The trigger for the answer message
const answerTime = 15; // time in seconds to answer a quiz question
const url = "http://opentdb.com/api.php?amount=1"; // Trivia DB url to fetch the JSON from.
const correctTime = answerTime * 1000; // Miliseconds

// Variables

var stillGoing = false; // Is a trivia in progress?
var correctNum = 0; // The correct answer's number. Global, so we can check in the answer function.
var maxNum = 0; // The biggest number a user can respond with. Global, see above.i
var quizChannel; // Current channel the quiz is going in
var timer; // Timer for the trivia timeout

// Commands

const commands = [
//	TRIGGER			FUNCTION
	['!quiz',		'quizTrigger'],
	['!a',			'answerTrigger'],
	['!setdiff',	'setDifficulty']
];

// NOTE: YOU SHOULD NOT REMOVE ANY OF THE ABOVE FUNCTIONS, ONLY MODIFY THEIR TRIGGERS!
// - IF YOU DO REMOVE ANYTHING, IT WILL BREAK THE BOT! MODIFY AT YOUR OWN RISK!
// - DO NOT PUT SPACES IN THE TRIGGER NAMES! IT CAN BREAK THE BOT! USE UNDERSCORE ( _ ) INSTEAD!

// Command Help:
// FUNCTION NAME		ACTION/NOTES
// -------------	|	------------------
// quizTrigger 		|	takes no arguments, triggers the quiz/trivia
// answerTrigger	|	takes 1 argument (1: answer number), triggers the answer
// setDifficulty	|	takes 1 argument (1: difficulty), set the global difficulty for the quizes/trivias

// Functions

// Escape HTML
// todo: Fix
function escapeHtml(str) {
	return str.replace(/&#(\d+);/g, function(match, dec) {
		return String.fromCharCode(dec);
	});
};

// Find an item in a 2D array.
function findItemArray(needle, hay) {
    for (var i = 0; i < hay.length; i++) {
        if (hay[i][0] == needle || hay[i][1] == needle) {
            return i;
        }
    }
    return false;	// Not found
}

// Get either a command's trigger or name. See below
function getCommand(search, mode=0) { // mode 0: return command trigger // mode 1: return function name
	var _found = commands[findItemArray(search, commands)];
	
	if(!_found) return false;
	
	switch(mode) {
		case 0:
		case 1:
			return _found[mode];
			break;
			
		default:
			return false;
	}
}

// Check if the user can start a quiz or not
function checkQuiz(message) {
	var err = '';
	if(stillGoing && message.channel != quizChannel)			err='A quiz is already going in ' + quizChannel + ' !';
	else if(stillGoing)											err='A quiz is already going in this channel!';
	else return true;
	
	if(err != '') {
		message.reply(err);
	}
}

// Check if answer is all correct
function checkAnswer(message) {
	var err = '';
	var msg = message.content.split(" ");
	var arg1 = parseInt(msg[1]);
	if(stillGoing && message.channel != quizChannel) 			err='The quiz is going in ' + quizChannel + ' !';
	else if(!stillGoing) 										err='No quiz is currently going! Start one with !quiz.';
	else if(typeof msg[1] === 'undefined')						err='No answer was given';
	else if(isNaN(msg[1]))										err='Answer is not a number';
	else if(arg1 < 1)											err='Answer is too small';
	else if(arg1 > maxNum)										err='Answer is too big';
	else return true;
	
	if(err != '') {
		message.reply(err);
	}
}

// Main

bot.on('ready', () => {
	console.log('Bot Ready');
	console.log('Trigger command: ' + getCommand('quizTrigger'));
});

bot.on('message', message => {
	// Please note that below is an array
	var currMessage = message.content.split(" ");
	
	if(getCommand(currMessage[0]) !== false) { // Is a command
		var currCommand = getCommand(currMessage[0], 1); // Get the command name
		//message.reply('Function for trigger: ' + currCommand);
		
		if(currCommand == "quizTrigger") {
			if(checkQuiz(message)) {
				request({
					url: url,
					json: true
				}, function(error, response, body) {
					if (!error && response.statusCode === 200) {
						stillGoing = true;
						quizChannel = message.channel;
						var triviaMessage = 'Category: *' + escapeHtml(body.results[0].category) + '*, Difficulty: *' + body.results[0].difficulty + '*\n__**' + escapeHtml(body.results[0].question) + '**__';
						correctNum = Math.floor((Math.random() * body.results[0].incorrect_answers.length) + 1);
						maxNum = body.results[0].incorrect_answers.length+1;
						var b = -1;
						for(var i = 1; i < body.results[0].incorrect_answers.length+2; i++) {
							if (i == correctNum) {
								triviaMessage += '\n**[ ' + i + ' ]** ' + escapeHtml(body.results[0].correct_answer);
							} else {
								b++;
								triviaMessage += '\n**[ ' + i + ' ]** ' + escapeHtml(body.results[0].incorrect_answers[b]);
							}
						}
						triviaMessage += '\nTime remaining: ' + answerTime + ' seconds\nSend the answer: ' + answerTrigger + '  <number>';
						
						message.channel.sendMessage(triviaMessage);
						
						timer = setTimeout(function() {
							message.channel.sendMessage('__**Time is up, the Trivia is over!**__\nThe correct answer was: **' + body.results[0].correct_answer + '**');
							stillGoing = false;
						}, correctTime);
					} else {
						message.reply('Sorry, I failed to connect to the Open Trivia Database :(\nError: ' + response.statusCode);
						console.log('Failed to fetch from OTD. Response code was: ' + response.statusCode);
					}
				});
			}
		} else if(currCommand == "answerTrigger") {
			if(checkAnswer(message)) {
				// WE ARE ASSUMING that everything returned true. Convert right away.
				var answer = parseInt(message.content.split(" ")[1]);
				if(answer == correctNum) {
					message.reply('Correct answer! Congratulations!');
					stillGoing = false;
					clearTimeout(timer);
				} else {
					message.reply('Incorrect answer! Try again!');
				}
			}
		}
	}
});

// Finally, log the bot in

bot.login(token);
