module.exports = {
	name: 'put',
    description: 'Put a user in a Meeting (Moderator only)',
    url: 'https://github.com/Arc13/meetlife-bot/wiki/1.11-"Put"-command',
    
	execute(stuff) {
        if (!stuff.message.member.hasPermission(stuff.discord.Permissions.FLAGS.MANAGE_MESSAGES)) {
            stuff.sendUtils.sendError(stuff.message.channel, stuff.message.author.id, 'This command is only available to moderators.');
            return
        }

        if (stuff.args.length >= 2) {
            const meetingId = parseInt(stuff.args[0]);
            if (isNaN(meetingId)) {
                stuff.sendUtils.sendError(stuff.message.channel, stuff.message.author.id, 'Invalid Meeting ID.');
                return;
            }

            if (stuff.message.mentions.users.size <= 0) {
                stuff.sendUtils.sendError(stuff.message.channel, stuff.message.author.id, 'You must mention the user to be put.');
                return;
            }

            const putUser = stuff.message.mentions.users.first();

            if (!stuff.message.guild || !stuff.message.guild.available) {
                stuff.sendUtils.sendError(stuff.dbObjects.UpcomingMeetings, stuff.message.author.id, stuff.message.channel, 'Guild is not available for this operation.')
                return;
            }
            const guildId = stuff.message.guild.id;

            stuff.meetingMan.doesMeetingExists(meetingId, guildId)
                .then(exists => {
                    if (exists) {
                        if (!stuff.message.guild || !stuff.message.guild.available) {
                            throw 'Guild is not available for this operation.';
                        }

                        return stuff.meetingMan.joinUserToMeeting(putUser.id, meetingId, guildId, 1, true);
                    } else {
                        throw "Invalid Meeting ID."
                    }
                }).then(result => {
                    stuff.sendUtils.sendConfirmation(stuff.message.channel, stuff.message.author.id, '<@' + putUser.id + '> has been forced to join this Meeting.', 'User force-joined to Meeting #' + meetingId, 'Moderator command');
                }).catch(e => {
                    stuff.sendUtils.sendError(stuff.message.channel, stuff.message.author.id, e);
                    console.log(e);
                });
        } else {
            stuff.sendUtils.sendUsage(stuff.message.channel, stuff.message.author.id, this.name, '[meeting id] [member mention]');
        }
    },
    
    getHelp(args) {
        if (args.length == 0) {
            const argsList = [
                {name: 'id', description: 'ID of a Meeting, to put a member in'},
                {name: 'member: mention', description: 'Mention of the member that will force-join'}
            ];

            return {command: this.name, args: argsList};
        }
    },
};