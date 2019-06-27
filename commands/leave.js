module.exports = {
	name: 'leave',
    description: 'Meeting le(a)ver',
    
	execute(stuff) {
        if (stuff.args.length >= 1) {
            const meetingId = parseInt(stuff.args[0]);
            if (!isNaN(meetingId)) {
                stuff.meetingMan.leaveUserFromMeeting(stuff.message.author.id, meetingId)
                    .then(function() {
                        stuff.sendUtils.sendConfirmation(stuff.message.channel, 'You have left Meeting #' + meetingId);
                    })
                    .catch(function(error) {
                        stuff.sendUtils.sendError(stuff.message.channel, stuff.message.author.id, error);
                    });
            } else {
                stuff.sendUtils.sendError(stuff.message.channel, stuff.message.author.id, 'Invalid meeting id.');
            }
        } else {
            stuff.sendUtils.sendUsage(stuff.message.channel, this.name, '[meeting id]');
        }
	},
};