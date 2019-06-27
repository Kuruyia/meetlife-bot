module.exports = {
	name: 'list',
    description: 'Get a list of upcoming Meetings',
    
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

        stuff.dbObjects.UpcomingMeetings.findAndCountAll({
            where: {
                start_time: {
                    [stuff.dbObjects.seqOp.gt]: actualTime
                }
            },
            offset: page * stuff.config.search_limit,
            limit: stuff.config.search_limit,
            order: [[stuff.dbObjects.sequelize.col('start_time'), isDesc ? 'DESC' : 'ASC']]
        }).then(result => {
            stuff.sendUtils.sendSearchResult(stuff.message.channel, stuff.message.author.id, result.rows, 'Upcoming meeting list', isDesc ? 'Sorted from descending order' : 'Sorted from ascending order', result.count, page + 1);
        });
	},
};