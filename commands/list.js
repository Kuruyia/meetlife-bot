module.exports = {
	name: 'list',
    description: 'Get a list of upcoming Meetings',
    url: 'https://github.com/Arc13/meetlife-bot/wiki/1.9-"List"-command',
    
	execute(stuff) {
        var isDesc = false;
        var page = 0;
        const actualTime = new Date().getTime() / 1000;

        if (stuff.args.length >= 1) {
            const parsedPage = parseInt(stuff.args[0]);

            if (!isNaN(parsedPage) && parsedPage > 0) {
                page = parsedPage - 1;
            } else {
                stuff.sendUtils.sendError(stuff.message.channel, stuff.message.author.id, 'Invalid page: **' + stuff.args[0] + '**');
                return;
            }
        }

        if (stuff.args.length >= 2) {
            if (stuff.args[1].toLowerCase() == 'd') {
                isDesc = true;
            } else if (stuff.args[1].toLowerCase() != 'a') {
                stuff.sendUtils.sendError(stuff.message.channel, stuff.message.author.id, 'Invalid input: The second argument must be either _d_ for descending or _a_ for ascending.');
                return;
            }
        }

        if (!stuff.message.guild || !stuff.message.guild.available) {
            stuff.sendUtils.sendError(stuff.dbObjects.UpcomingMeetings, stuff.message.author.id, stuff.message.channel, 'Guild is not available for this operation.')
            return;
        }
        const guildId = stuff.message.guild.id;

        stuff.dbObjects.UpcomingMeetings.findAndCountAll({
            where: {
                start_time: {
                    [stuff.dbObjects.seqOp.gt]: actualTime
                },
                guild_id: guildId
            },
            offset: page * stuff.config.search_limit,
            limit: stuff.config.search_limit,
            order: [[stuff.dbObjects.sequelize.col('start_time'), isDesc ? 'DESC' : 'ASC']]
        }).then(result => {
            stuff.sendUtils.sendSearchResult(stuff.message.channel, stuff.message.author.id, result.rows, 'Upcoming meeting list', isDesc ? 'Sorted from descending order' : 'Sorted from ascending order', result.count, page + 1);
        });
    },
    
    getHelp(args) {
        if (args.length == 0) {
            const argsList = [
                {name: 'page', description: 'Number of the page to show', optional: true},
                {name: 'a/d', description: 'Set the list in an ascending (a) or descending (d) order, based on starting date', optional: true}
            ];

            return {command: this.name, args: argsList};
        }
    },
};