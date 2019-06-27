module.exports = {
	name: 'join',
    description: 'Meeting joiner',
    
	execute(stuff) {
        if (stuff.args.length >= 1) {
            const meetingId = parseInt(stuff.args[0]);
            if (!isNaN(meetingId)) {
                stuff.meetingMan.joinUserToMeeting(stuff.message.author.id, meetingId)
                    .then(function() {
                        stuff.sendUtils.sendConfirmation(stuff.message.channel, 'You have joined Meeting #' + meetingId);
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