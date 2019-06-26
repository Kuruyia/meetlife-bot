module.exports = {
	name: 'leave',
    description: 'Meeting le(a)ver',
    
	execute(stuff) {
        if (stuff.args.length >= 1) {
            const meetingId = parseInt(stuff.args[0]);
            if (!isNaN(meetingId)) {
                stuff.meetingMan.leaveUserFromMeeting(stuff, stuff.message.author.id, meetingId)
                    .then(function() {
                        stuff.utils.sendConfirmation(stuff.message.channel, 'You have left Meeting #' + meetingId);
                    })
                    .catch(function(error) {
                        stuff.utils.sendError(stuff.message.channel, error);
                    });
            } else {
                stuff.utils.sendError(stuff.message.channel, 'Invalid meeting id.');
            }
        } else {
            stuff.utils.sendUsage(stuff.message.channel, this.name, '[meeting id]');
        }
	},
};