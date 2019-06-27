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
                            stuff.sendUtils.sendError(stuff.message.channel, 'Invalid page: **' + stuff.args[2] + '**');
                            return;
                        }
                    }

                    stuff.meetingMan.sendMeetingMembersPanel(stuff, stuff.client, meetingId, page);
                } else if (stuff.args.length < 2 || stuff.args[1] == 'info') {
                    stuff.meetingMan.sendInfoPanel(stuff, stuff.message.channel, meetingId);
                } else {
                    stuff.sendUtils.sendUsage(stuff.message.channel, this.name, '[meeting id] _(info/members)_');
                }
            } else {
                stuff.sendUtils.sendError(stuff.message.channel, 'Invalid meeting id.');
            }
        } else {
            stuff.sendUtils.sendUsage(stuff.message.channel, this.name, '[meeting id] _(info/members)_');
        }
	},
};