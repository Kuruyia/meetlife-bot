module.exports = {
	name: 'info',
    description: 'Meeting info',
    
	execute(stuff) {
        if (stuff.args.length >= 1) {
            const meetingId = parseInt(stuff.args[0]);
            if (!isNaN(meetingId)) {
                if (stuff.args.length >= 2 && stuff.args[1] == 'members') {
                    var page = 0;
                    if (stuff.args.length >= 3) {
                        const parsedPage = parseInt(stuff.args[2]);

                        if (!isNaN(parsedPage) && parsedPage > 0) {
                            page = parsedPage - 1;
                        } else {
                            stuff.sendUtils.sendError(stuff.message.channel, stuff.message.author.id, 'Invalid page: **' + stuff.args[2] + '**');
                            return;
                        }
                    }

                    stuff.sendUtils.sendMeetingMembersPanel(stuff.message.channel, stuff.message.author.id, meetingId, page);
                } else if (stuff.args.length < 2 || stuff.args[1] == 'info') {
                    stuff.sendUtils.sendInfoPanel(stuff.message.author.id, stuff.message.channel, meetingId);
                } else {
                    stuff.sendUtils.sendUsage(stuff.message.channel, this.name, '[meeting id] _(info/members)_');
                }
            } else {
                stuff.sendUtils.sendError(stuff.message.channel, stuff.message.author.id, 'Invalid meeting id.');
            }
        } else {
            stuff.sendUtils.sendUsage(stuff.message.channel, this.name, '[meeting id] _(info/members)_');
        }
	},
};