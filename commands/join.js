module.exports = {
	name: 'join',
    description: 'Meeting joiner',
    
	execute(stuff) {
        if (stuff.args.length >= 1) {
            const meetingId = parseInt(stuff.args[0]);
            if (!isNaN(meetingId)) {
                var notifDelay = 1;
                if (stuff.args.length >= 2) {
                    const parsedSecondArg = parseFloat(stuff.args[1])
                    if (!isNaN(parsedSecondArg) && parsedSecondArg >= 0 && parsedSecondArg <= 24 * 7) {
                        notifDelay = parsedSecondArg;
                    } else {
                        stuff.sendUtils.sendError(stuff.message.channel, stuff.message.author.id, 'Invalid input: The second argument must be an hour between **0** and **168**.');
                        return;
                    }
                }

                stuff.meetingMan.joinUserToMeeting(stuff.message.author.id, meetingId, notifDelay)
                    .then(function() {
                        stuff.sendUtils.sendConfirmation(stuff.message.channel, stuff.message.author.id, 'You have joined Meeting #' + meetingId);
                    })
                    .catch(function(error) {
                        stuff.sendUtils.sendError(stuff.message.channel, stuff.message.author.id, error);
                    });
            } else {
                stuff.sendUtils.sendError(stuff.message.channel, stuff.message.author.id, 'Invalid meeting id.');
            }
        } else {
            stuff.sendUtils.sendUsage(stuff.message.channel, stuff.message.author.id, this.name, '[meeting id]');
        }
	},
};