module.exports = {
	name: 'kick',
    description: 'Kick a member of your Meeting',
    
	execute(stuff) {
        if (stuff.args.length >= 2) {
            const meetingId = parseInt(stuff.args[0]);
            if (isNaN(meetingId)) {
                stuff.sendUtils.sendError(stuff.message.channel, stuff.message.author.id, 'Invalid Meeting ID.');
                return;
            }

            if (stuff.message.mentions.users.length <= 0) {
                stuff.sendUtils.sendError(stuff.message.channel, stuff.message.author.id, 'You must mention the user to be kicked.');
                return;
            }

            const kickedUser = stuff.message.mentions.users.first();

            stuff.meetingMan.doesMeetingExists(meetingId)
                .then(exists => {
                    if (exists) {
                        return stuff.meetingMan.getMeetingData(meetingId);
                    } else {
                        throw "Invalid Meeting ID."
                    }
                }).then(result => {
                    const data = result.dataValues;
                    if (data.owner_id == stuff.message.author.id || stuff.message.member.hasPermission(stuff.discord.Permissions.FLAGS.MANAGE_MESSAGES)) {
                        return Promise.all([
                            data.owner_id != stuff.message.author.id && stuff.message.member.hasPermission(stuff.discord.Permissions.FLAGS.MANAGE_MESSAGES),
                            stuff.meetingMan.leaveUserFromMeeting(kickedUser.id, meetingId)
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
};