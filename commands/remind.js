module.exports = {
	name: 'remind',
    description: 'Change the remind time of a joined Meeting',
    url: 'https://github.com/Arc13/meetlife-bot/wiki/1.12-"Remind"-command',
    
	execute(stuff) {
        if (stuff.args.length >= 2) {
            const meetingId = parseInt(stuff.args[0]);
            var minuteMode = false;
            if (stuff.args[1].endsWith('m') || stuff.args[1].endsWith('h')) {
                minuteMode = stuff.args[1].endsWith('m');
                stuff.args[1] = stuff.args[1].substr(0, stuff.args[1].length - 1);
            }

            var parsedTime = parseFloat(stuff.args[1]);
            var delay;
            if (isNaN(parsedTime) || (delay = minuteMode ? parsedTime / 60 : parsedTime) < 0 || delay > 168) {
                stuff.sendUtils.sendError(stuff.message.channel, stuff.message.author.id, 'The second argument must be an hour between **0** and **168**,\nor a minute between **0** and **10 080** suffixed with the letter "m".');
                return;
            }

            if (!isNaN(meetingId)) {
                if (!stuff.message.guild || !stuff.message.guild.available) {
                    stuff.sendUtils.sendError(stuff.dbObjects.UpcomingMeetings, stuff.message.author.id, stuff.message.channel, 'Guild is not available for this operation.')
                    return;
                }
                const guildId = stuff.message.guild.id;

                stuff.meetingMan.doesMeetingExists(meetingId, guildId)
                    .then(exists => {
                        if (exists) {
                            return stuff.meetingMan.isMeetingOver(meetingId, guildId);
                        } else {
                            throw "Invalid Meeting ID."
                        }
                    }).then(over => {
                        if (!over) {
                            return stuff.meetingMan.hasUserJoinedMeeting(stuff.message.author.id, meetingId);
                        } else {
                            throw "You can't change the reminder of a finished Meeting.";
                        }
                    }).then(joined => {
                        if (joined) {
                            return stuff.dbObjects.JoinedMeetings.update(
                                {
                                    notified: false,
                                    notify_delay: delay
                                },
                                {where: {
                                    user_id: stuff.message.author.id,
                                    upcoming_meeting_id: meetingId
                                }}
                            );
                        } else {
                            throw "You are not in this Meeting.";
                        }
                    }).then(result => {
                        if (result[0] > 0) {
                            var confirmMessage = 'You have modified the reminder for Meeting **#' + meetingId + '**\n';
                            if (delay < 1) {
                                const minutes = parseInt(delay * 60);
                                confirmMessage = confirmMessage.concat('You will be reminded ' + minutes + (minutes > 1 ? ' minutes ' : ' minute ') + 'before the Meeting begins.');
                            } else {
                                const hour = parseInt(delay);
                                confirmMessage = confirmMessage.concat('You will be reminded ' + hour + 'h' + parseInt(delay * 60 - (hour * 60)).toString().padStart(2, '0') + ' before the Meeting begins.');
                            }

                            stuff.sendUtils.sendConfirmation(stuff.message.channel, stuff.message.author.id, confirmMessage);
                        } else {
                            throw 'Unable to change this reminder.'
                        }
                    }).catch(e => {
                        stuff.sendUtils.sendError(stuff.message.channel, stuff.message.author.id, e);
                    });
            } else {
                stuff.sendUtils.sendError(stuff.message.channel, stuff.message.author.id, 'Invalid Meeting ID.');
            }
        } else {
            stuff.sendUtils.sendUsage(stuff.message.channel, stuff.message.author.id, this.name, ' [meeting id] [delay time]');
        }
    },
    
    getHelp(args) {
        if (args.length == 0) {
            const argsList = [
                {name: 'id', description: 'ID of the Meeting to join'},
                {name: 'remind', description: "Delay you'll be reminded before the Meeting begins\nDefault unit: hour, change to minute by following the number by a \"m\""}
            ];

            return {command: this.name, args: argsList};
        }
    },
};