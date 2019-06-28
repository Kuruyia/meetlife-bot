module.exports = {
	name: 'joinlist',
    description: 'Get a list of Meetings you joined',
    url: 'https://github.com/Arc13/meetlife-bot/wiki/1.6-"Joinlist"-command',
    
	execute(stuff) {
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

        stuff.dbObjects.JoinedMeetings.findAndCountAll({
            where: {
                user_id: stuff.message.author.id,
            },
            offset: page * stuff.config.search_limit,
            limit: stuff.config.search_limit,
            include: [{
                model: stuff.dbObjects.UpcomingMeetings,
                where: {
                    start_time: {
                        [stuff.dbObjects.seqOp.gt]: actualTime
                    }
                }
            }]
        }).then(result => {
            var promiseList = [result.count];
            for (i = 0; i < result.rows.length; i++) {
                const data = result.rows[i].dataValues;
                promiseList.push(stuff.meetingMan.getMeetingData(data.upcoming_meeting_id));
            }
            
            return Promise.all(promiseList);
        }).then(result => {
            const count = result.shift();

            stuff.sendUtils.sendSearchResult(stuff.message.channel, stuff.message.author.id, result, 'Joined meetings', null, count, page + 1);
        });
    },
};