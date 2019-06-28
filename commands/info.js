module.exports = {
	name: 'info',
    description: 'Get information about a Meeting',
    url: 'https://github.com/Arc13/meetlife-bot/wiki/1.4-"Info"-command',
    
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
                    stuff.sendUtils.sendUsage(stuff.message.channel, stuff.message.author.id, this.name, '[meeting id] _(info/members)_');
                }
            } else {
                stuff.sendUtils.sendError(stuff.message.channel, stuff.message.author.id, 'Invalid Meeting ID.');
            }
        } else {
            stuff.sendUtils.sendUsage(stuff.message.channel, stuff.message.author.id, this.name, '[meeting id] _(info/members)_');
        }
    },
    
    getHelp(args) {
        if (args.length == 0) {
            const argsList = [
                {name: 'id', description: 'ID of the Meeting to get info from'},
                {name: 'info/members', description: "Select between showing Meeting's information or members\nDefault: info", optional: true}
            ];

            return {command: this.name, args: argsList};
        }
    },
};