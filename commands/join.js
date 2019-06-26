module.exports = {
	name: 'join',
    description: 'Meeting joiner',
    
	execute(stuff) {
        if (stuff.args.length >= 1) {
            const meetingId = parseInt(stuff.args[0]);
            if (!isNaN(meetingId)) {
                stuff.meetingMan.joinUserToMeeting(stuff, stuff.message.author.id, meetingId)
                    .then(function() {
                        stuff.utils.sendConfirmation(stuff.message.channel, 'You have joined Meeting #' + meetingId);
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