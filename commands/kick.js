module.exports = {
	name: 'kick',
    description: 'Kick a member of your Meeting',
    urm: 'https://github.com/Arc13/meetlife-bot/wiki/1.7-"Kick"-command',
    
	execute(stuff) {
        if (stuff.args.length >= 2) {
            const meetingId = parseInt(stuff.args[0]);
            if (isNaN(meetingId)) {
                stuff.sendUtils.sendError(stuff.message.channel, stuff.message.author.id, 'Invalid Meeting ID.');
                return;
            }

            if (stuff.message.mentions.users.size == 0) {
                stuff.sendUtils.sendError(stuff.message.channel, stuff.message.author.id, 'You must mention the user to be kicked.');
                return;
            }

            const kickedUser = stuff.message.mentions.users.first();

            if (!stuff.message.guild || !stuff.message.guild.available) {
                stuff.sendUtils.sendError(stuff.dbObjects.UpcomingMeetings, stuff.message.author.id, stuff.message.channel, 'Guild is not available for this operation.')
                return;
            }
            const guildId = stuff.message.guild.id;

            stuff.meetingMan.doesMeetingExists(meetingId, guildId)
                .then(exists => {
                    if (exists) {
                        return stuff.meetingMan.getMeetingData(meetingId, guildId);
                    } else {
                        throw "Invalid Meeting ID."
                    }
                }).then(result => {
                    const data = result.dataValues;
                    if (data.owner_id == stuff.message.author.id || stuff.message.member.hasPermission(stuff.discord.Permissions.FLAGS.MANAGE_MESSAGES)) {
                        return Promise.all([
                            data.owner_id != stuff.message.author.id && stuff.message.member.hasPermission(stuff.discord.Permissions.FLAGS.MANAGE_MESSAGES),
                            stuff.meetingMan.leaveUserFromMeeting(kickedUser.id, meetingId, guildId)
                        ]);
                    } else {
                        throw "You can't kick a member of this Meeting because you don't own it.";
                    }
                }).then(result => {
                    const ownerOverriden = result.shift();
                    stuff.sendUtils.sendConfirmation(stuff.message.channel, stuff.message.author.id, '<@' + kickedUser.id + '> has been kicked from this Meeting.', 'User kicked from Meeting #' + meetingId, ownerOverriden ? 'Moderator mode - Owner verification has been bypassed' : null);
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
                {name: 'id', description: 'ID of a Meeting you own, to kick a member from'},
                {name: 'member: mention', description: 'Mention of the member that will be kicked'}
            ];

            return {command: this.name, args: argsList};
        }
    },
};