module.exports = {
	name: 'list',
    description: 'Meeting list',
    
	execute(stuff) {
        var isDesc = false;
        var page = 0;
        if (stuff.args.length >= 1) {
            const parsedPage = parseInt(stuff.args[0]);

            if (!isNaN(parsedPage) && parsedPage > 0) {
                page = parsedPage - 1;
            } else {
                stuff.utils.sendError(stuff.message.channel, 'Invalid page: **' + stuff.args[0] + '**');
                return;
            }
        }

        if (stuff.args.length >= 2) {
            console.log('slt')
            if (stuff.args[1].toLowerCase() == 'd') {
                console.log('dab')
                isDesc = true;
            } else if (stuff.args[1].toLowerCase() != 'a') {
                stuff.utils.sendError(stuff.message.channel, 'Invalid input: The second argument must be either _d_ for descending or _a_ for ascending.');
                return;
            }
        }

        stuff.dbObjects.UpcomingMeetings.findAndCountAll({
            offset: page * stuff.config.search_limit,
            limit: stuff.config.search_limit,
            order: [[stuff.dbObjects.sequelize.col('start_time'), isDesc ? 'DESC' : 'ASC']]
        }).then(result => {
            stuff.meetingMan.sendSearchResult(stuff, result.rows, 'Upcoming meeting list', isDesc ? 'Sorted from descending order' : 'Sorted from ascending order', result.count, page + 1);
        });
	},
};