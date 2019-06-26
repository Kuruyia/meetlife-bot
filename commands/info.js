module.exports = {
	name: 'info',
    description: 'Meeting info',
    
	execute(stuff) {
        if (stuff.args.length >= 1) {
            const meetingId = parseInt(stuff.args[0]);
            if (!isNaN(meetingId)) {
                stuff.meetingMan.sendInfoPanel(stuff, meetingId);
            } else {
                stuff.utils.sendError(stuff.message.channel, 'Invalid meeting id.');
            }
        } else {
            stuff.utils.sendUsage(stuff.message.channel, this.name, '[meeting id]');
        }
	},
};