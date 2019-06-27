module.exports = {
	name: 'put',
    description: 'Put a user in a Meeting (Moderator only)',
    
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

            if (stuff.message.mentions.users.length <= 0) {
                stuff.sendUtils.sendError(stuff.message.channel, stuff.message.author.id, 'You must mention the user to be put.');
                return;
            }

            const putUser = stuff.message.mentions.users.first();

            stuff.meetingMan.doesMeetingExists(meetingId)
                .then(exists => {
                    if (exists) {
                        return stuff.meetingMan.joinUserToMeeting(putUser.id, meetingId);
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
};