module.exports = {
	name: 'leave',
    description: 'Leave a Meeting',
    url: 'https://github.com/Arc13/meetlife-bot/wiki/1.8-"Leave"-command',
    
	execute(stuff) {
        if (stuff.args.length >= 1) {
            const meetingId = parseInt(stuff.args[0]);
            if (!isNaN(meetingId)) {
                if (!stuff.message.guild || !stuff.message.guild.available) {
                    stuff.sendUtils.sendError(stuff.dbObjects.UpcomingMeetings, stuff.message.author.id, stuff.message.channel, 'Guild is not available for this operation.')
                    return;
                }
                const guildId = stuff.message.guild.id;

                stuff.meetingMan.leaveUserFromMeeting(stuff.message.author.id, meetingId, guildId)
                    .then(function() {
                        stuff.sendUtils.sendConfirmation(stuff.message.channel, stuff.message.author.id, 'You have left Meeting **#' + meetingId + '**');
                    })
                    .catch(function(error) {
                        stuff.sendUtils.sendError(stuff.message.channel, stuff.message.author.id, error);
                    });
            } else {
                stuff.sendUtils.sendError(stuff.message.channel, stuff.message.author.id, 'Invalid Meeting ID.');
            }
        } else {
            stuff.sendUtils.sendUsage(stuff.message.channel, stuff.message.author.id, this.name, '[meeting id]');
        }
    },
    
    getHelp(args) {
        if (args.length == 0) {
            const argsList = [
                {name: 'id', description: 'ID of the Meeting to leave'},
            ];

            return {command: this.name, args: argsList};
        }
    },
};