const fs = require('fs');
const Discord = require('discord.js');
const chronode = require('chrono-node');
const request = require('request');
const dbObjects = require('./dbObjects');
const choiceManager = require('./choiceManager');
const choice = require('./choice')
const config = require('./config.json');

const choiceMan = new choiceManager();
const client = new Discord.Client();
client.commands = new Discord.Collection();

const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	client.commands.set(command.name, command);
}

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('message', message => {
    if (!message.content.startsWith(config.prefix) || message.author.bot) return;

	const args = message.cleanContent.slice(config.prefix.length).split(/ +/);
    const command = args.shift().toLowerCase();

    if (command != 'choice' && choiceMan.hasUserActiveChoice(message.author.id)) {
        sendError(message.channel, 'You must select an option of your active choice before using the bot.');
        return;
    }
    
    var argsFormatted = [];
    var hasQuotes = false;
    var startQuote = 0;
    for (i = 0; i < args.length; i++) {
        if (args[i].startsWith('"') && !hasQuotes) {
            hasQuotes = true;
            startQuote = i;
        }
        if (((args[i].endsWith('"') && !args[i].endsWith('\"')) || i == args.length - 1) && hasQuotes) {
            hasQuotes = false;
            const stringToAdd = args.slice(startQuote, i + 1).join(' ');
            argsFormatted.push(stringToAdd.substr(1, stringToAdd.length - 2));
        } else if (!hasQuotes) {
            var stringToAdd = args[i];

            if (stringToAdd.startsWith('\"')) {
                stringToAdd = stringToAdd.substr(1);
            }
            if (stringToAdd.endsWith('\"')) {
                stringToAdd = stringToAdd.substr(0, stringToAdd.length - 2).concat('"');
            }

            argsFormatted.push(stringToAdd);
        }
    }

	if (!client.commands.has(command)) return;

    try {
        client.commands.get(command).execute({message: message,
            args: argsFormatted,
            dbObjects: dbObjects,
            chronode: chronode,
            request: request,
            sendError: sendError,
            discord: Discord,
            choiceMan: choiceMan,
            choice: choice,
            prefix: config.prefix});
    } catch (error) {
        console.error(error);
        message.reply('There was an error trying to execute that command!');
    }
});

function sendError(channel, message) {
    const constructedEmbed = new Discord.RichEmbed();
    constructedEmbed.setColor('RED');
    constructedEmbed.addField('Error', message);

    channel.send(constructedEmbed);
}

client.login(config.token);