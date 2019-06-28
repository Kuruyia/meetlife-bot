const version = 'MeetLife 1.0'

const fs = require('fs');
const Discord = require('discord.js');
const chronode = require('chrono-node');
const request = require('request');
const dbObjects = require('./DatabaseObjects');
const ChoiceManager = require('./ChoiceManager');
const MeetingManager = require('./MeetingManager');
const SendUtils = require('./SendUtils');
const choice = require('./Choice')
const config = require('./config.json');

const choiceMan = new ChoiceManager();
const meetingMan = new MeetingManager(dbObjects);
const sendUtils = new SendUtils(Discord, meetingMan, config.prefix, config.locale, config.search_limit);
const client = new Discord.Client();
client.commands = new Discord.Collection();

const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	client.commands.set(command.name, command);
}

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
  delete config.token;

  setInterval(() => {
    const sequelize = dbObjects.sequelize;
    const actualTime = new Date().getTime() / 1000;

    client.user.setPresence({game: { name:'Type "' + config.prefix + 'help" to start', type: 0}})

    sequelize.query('SELECT * FROM `joined_meetings` LEFT JOIN upcoming_meetings ON joined_meetings.upcoming_meeting_id = upcoming_meetings.id WHERE upcoming_meetings.start_time < ' + actualTime + ' + (joined_meetings.notify_delay * 3600) AND NOT joined_meetings.notified')
        .then(result => {
            const queryRes = result[0];

            for (i = 0; i < queryRes.length; i++) {
                const currentRow = queryRes[i];
                const userId = currentRow.user_id;
                const meetingId = currentRow.upcoming_meeting_id;
                const guildId = currentRow.guild_id;

                dbObjects.JoinedMeetings.update(
                    {notified: true},
                    {where: {
                        user_id: userId,
                        upcoming_meeting_id: meetingId
                    }}
                );

                sendUtils.notifyUser(client, userId, 'A Meeting you have joined will start soon.', meetingId, guildId);
            }
        });
}, 60 * 1000);
});

client.on('message', message => {
    if (!message.content.startsWith(config.prefix) || message.author.bot) return;

	const args = message.cleanContent.slice(config.prefix.length).split(/ +/);
    const command = args.shift().toLowerCase();

    if (command != 'choice' && command != 'help' && choiceMan.hasUserActiveChoice(message.author.id)) {
        sendUtils.sendError(message.channel, message.author.id, 'You must select an option of your active choice before using the bot.', 'Error', 'Use the ' + config.prefix + 'help choice command for more help.');
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
            sendUtils: sendUtils,
            discord: Discord,
            client: client,
            choiceMan: choiceMan,
            meetingMan: meetingMan,
            choice: choice,
            config: config});
    } catch (error) {
        console.error(error);
        sendUtils.sendError(message.channel, message.author.id, "An error occured while executing this command.")
    }
});

client.on('guildMemberRemove', member => {
    if (member.guild.available) {
        const guildId = member.guild.id;

        dbObjects.UpcomingMeetings.destroy({
            where: {
                owner_id: member.id,
                guild_id: guildId
            }
        });
    
        dbObjects.JoinedMeetings.findAll({
            where: {
                user_id: member.id
            },
            include: [{
                model: dbObjects.UpcomingMeetings,
                where: {
                    guild_id: guildId
                }
            }]
        }).then(result => {
            for (i = 0; i < result.length; i++) {
                result[i].destroy();
            }
        });
    }
});

client.login(config.token);