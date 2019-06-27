const fs = require('fs');
const Discord = require('discord.js');
const chronode = require('chrono-node');
const request = require('request');
const dbObjects = require('./dbObjects');
const ChoiceManager = require('./choiceManager');
const MeetingManager = require('./meetingManager');
const choice = require('./choice')
const config = require('./config.json');

const choiceMan = new ChoiceManager();
const meetingMan = new MeetingManager();
const client = new Discord.Client();
client.commands = new Discord.Collection();

var Utils = {
    sendError: function(channel, message, title = 'Error') {
        const constructedEmbed = new Discord.RichEmbed();
        constructedEmbed.setColor('RED');
        constructedEmbed.addField(title, message);
    
        channel.send(constructedEmbed);
    },
    
    sendConfirmation: function(channel, message, title = 'Confirmation', footer) {
        const constructedEmbed = new Discord.RichEmbed();
        constructedEmbed.setColor('BLUE');
        constructedEmbed.addField(title, message);

        if (footer) {
            constructedEmbed.setFooter(footer);
        }
    
        channel.send(constructedEmbed);
    },
    
    sendUsage: function(channel, command, message) {
        const constructedEmbed = new Discord.RichEmbed();
        constructedEmbed.setColor('ORANGE');
        
        if (Array.isArray(message)) {
            var genText = '';
            for (i = 0; i < message.length; i++) {
                genText = genText.concat('**' + config.prefix + command + '** ' + message[i] + '\n');
            }
    
            constructedEmbed.addField('Usage', genText);
        } else {
            constructedEmbed.addField('Usage', '**' + config.prefix + command + '** ' + message);
        }
    
        channel.send(constructedEmbed);
    },

    sendPagedList: function(channel, textList, title, footer = null, count = textList.length, page = 1) {
        const constructedEmbed = new Discord.RichEmbed();
        const maxPage = Math.ceil(count / config.search_limit);
        
        if (textList.length > 0) {
            constructedEmbed.setColor('BLUE');

            var textLength = 0;
            var message = '';
            var isFirstField = true;
            for (i = 0; i < textList.length; i++) {
                const actualText = textList[i] + '\n';
                message = message.concat(actualText);
                textLength += actualText.length;

                if (i < textList.length - 1 && textLength + (textList[i + 1] + '\n').length > 1024) {
                    constructedEmbed.addField(isFirstField ? title : '\u200B', message);

                    textLength = 0;
                    message = '';
                    isFirstField = false;
                }
            }
            if (message.length > 0) {
                constructedEmbed.addField(isFirstField ? title : '\u200B', message);
            }

            var footerText = '';
            if (footer) {
                footerText = footerText.concat(footer + ' - ')
            }
            footerText = footerText.concat(count + (count > 1 ? ' results' : ' result'));
            if (count != textList.length) {
                footerText = footerText.concat(', ' + textList.length + ' shown');

                title = title.concat(' [' + page + '/' + maxPage + ']');
            }

            constructedEmbed.setFooter(footerText);
        } else {
            constructedEmbed.setColor('RED');

            if (page > maxPage) {
                constructedEmbed.addField(title, 'This page does not exist. (Max. **' + maxPage + '**)');
            } else {
                constructedEmbed.addField(title, 'No result found.');
            }
        }

        channel.send(constructedEmbed);
    },

    formatDate: function(startDate, endDate) {
        var dateStr = '';
        if (endDate) {
            if (startDate.getFullYear() == endDate.getFullYear() && startDate.getMonth() == endDate.getMonth() && startDate.getDate() == endDate.getDate()) {
                dateStr = startDate.toLocaleString(config.locale, {day: '2-digit', month: 'long', year: 'numeric'}).concat('\n');
                dateStr = dateStr.concat(startDate.toLocaleString(config.locale, {hour: '2-digit', minute: '2-digit'}));
                dateStr = dateStr.concat(' - ' + endDate.toLocaleString(config.locale, {hour: '2-digit', minute: '2-digit'}));
            } else {
                dateStr = startDate.toLocaleString(config.locale, {day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'}).concat('\n');
                dateStr = dateStr.concat('**To** ' + endDate.toLocaleString(config.locale, {day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'}));
            }
        } else {
            dateStr = startDate.toLocaleString(config.locale, {day: '2-digit', month: 'long', year: 'numeric'}).concat('\n');
            dateStr = dateStr.concat(startDate.toLocaleString(config.locale, {hour: '2-digit', minute: '2-digit'}));
        }

        return dateStr;
    }
};

const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	client.commands.set(command.name, command);
}

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
  delete config.token;
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
        if (((args[i].endsWith('"') && !args[i].endsWith('\\"')) || i == args.length - 1) && hasQuotes) {
            hasQuotes = false;
            const stringToAdd = args.slice(startQuote, i + 1).join(' ');
            argsFormatted.push(stringToAdd.substr(1, stringToAdd.length - 2));
        } else if (!hasQuotes) {
            var stringToAdd = args[i];

            if (stringToAdd.startsWith('\\"')) {
                stringToAdd = stringToAdd.substr(1);
            }
            if (stringToAdd.endsWith('\\"')) {
                stringToAdd = stringToAdd.substr(0, stringToAdd.length - 2).concat('"');
            }

            argsFormatted.push(stringToAdd);
        }
    }

	if (!client.commands.has(command)) {
        console.log('unknown command!');
        return;
    }

    try {
        client.commands.get(command).execute({message: message,
            args: argsFormatted,
            dbObjects: dbObjects,
            chronode: chronode,
            request: request,
            utils: Utils,
            discord: Discord,
            choiceMan: choiceMan,
            meetingMan: meetingMan,
            choice: choice,
            config: config});
    } catch (error) {
        console.error(error);
        sendError(message.channel, "An error occured while executing this command.")
    }
});

client.login(config.token);