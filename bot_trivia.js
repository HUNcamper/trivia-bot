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

var stillGoing = false; // Is a trivia in progress?
var correctNum = 0; // The correct answer's number. Global, so we can check in the answer function.
var maxNum = 0; // The biggest number a user can respond with. Global, see above.
var timer; // Timer for the trivia timeout

bot.on('ready', () => {
	console.log('Bot Ready');
	console.log('Trigger command: ' + trigger);
});

bot.on('message', message => {
	if (stillGoing && message.content.split(" ")[0] == trigger) {
		messageSplit = message.content.split(" ");
		var currChannel = message.channel;
		// If second argument is defined
		if(typeof messageSplit[1] !== 'undefined') {
			// If second argument is integer
			if(!isNaN(messageSplit[1])) {
				var num = parseInt(messageSplit[1]);
				if(num >= 1 && num <= maxNum) {
					if(num == correctNum) {
						message.reply('Correct answer! Congratulations!');
						stillGoing = false;
						clearTimeout(timer);
					} else {
						message.reply('Incorrect answer!');
					}
				} else {
					message.reply('You wrote an incorrect number!');
				}
			} else {
				message.reply('The answer must be a number!');
			}
		} else {
			message.reply('You must write an answer number!');
		}
	}
	if (message.content === trigger) {
		var currChannel = message.channel;
		if (stillGoing) {
			message.reply('Sorry, but a Trivia is already going!');
		} else {
		
		// Fetch the JSON
		request({
			url: url,
			json: true
		}, function(error, response, body) {
			if (!error && response.statusCode === 200) {
				stillGoing = true;
				var triviaMessage = 'Category: *' + body.results[0].category + '*, Difficulty: *' + body.results[0].difficulty + '*\n__**' + body.results[0].question + '**__';
				correctNum = Math.floor((Math.random() * body.results[0].incorrect_answers.length) + 1);
				maxNum = body.results[0].incorrect_answers.length+1;
				var b = -1;
				for(var i = 1; i < body.results[0].incorrect_answers.length+2; i++) {
					if (i == correctNum) {
						triviaMessage += '\n**[ ' + i + ' ]** ' + body.results[0].correct_answer;
					} else {
						b++;
						triviaMessage += '\n**[ ' + i + ' ]** ' + body.results[0].incorrect_answers[b];
					}
				}
				triviaMessage += '\nTime remaining: ' + answerTime + ' seconds\nSend the answer: ' + answerTrigger + '  <number>';
				
				currChannel.sendMessage(triviaMessage);
				
				var correctTime = answerTime * 1000; // Miliseconds, duh
				
				timer = setTimeout(function() {
					currChannel.sendMessage('__**Time is up, the Trivia is over!**__\nThe correct answer was: **' + body.results[0].correct_answer + '**');
					stillGoing = false;
				}, correctTime);
			} else {
				message.reply('Sorry, I failed to connect to the trivia database :(');
				console.log('Failed to fetch from trivia database. Response code was: ' + response.statusCode);
			}
		});
		}
	}
});

// Finally, log the bot in

bot.login(token);
