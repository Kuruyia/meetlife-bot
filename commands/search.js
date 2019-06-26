module.exports = {
	name: 'search',
    description: 'Meeting search',
    
	execute(stuff) {
        var page = 0;
        if (stuff.args.length >= 3) {
            const parsedPage = parseInt(stuff.args[2]);

            if (!isNaN(parsedPage) && parsedPage > 0) {
                page = parsedPage - 1;
            } else {
                stuff.utils.sendError(stuff.message.channel, 'Invalid page: **' + stuff.args[2] + '**');
                return;
            }
        }
        
        if (stuff.args[0] == 'location') {
            if (stuff.args.length >= 2) {
                stuff.dbObjects.UpcomingMeetings.findAndCountAll({
                    offset: page * stuff.config.search_limit,
                    limit: stuff.config.search_limit,
                    where: {
                        location_name: {
                            [stuff.dbObjects.seqOp.substring]: stuff.args[1]
                        }
                    }
                }).then(searchResults => {
                    stuff.meetingMan.sendSearchResult(stuff, searchResults.rows, 'Search by location - "' + stuff.args[1] + '"', null, searchResults.count, page + 1);
                });
            } else {
                stuff.utils.sendUsage(stuff.message.channel, this.name + ' location', '[location] _(page)_');
            }
        } else if (stuff.args[0] == 'day') {
            if (stuff.args.length >= 2) {
                const chronoRes = stuff.chronode.parse(stuff.args[1]);

                if (chronoRes.length == 0) {
                    stuff.utils.sendError(stuff.message.channel, 'Unable to find a valid date in "' + stuff.args[1] + '"');
                    return;
                }

                const queryDate = chronoRes[0].start.date();
                queryDate.setHours(0);
                queryDate.setMinutes(0);
                queryDate.setSeconds(0);

                const startTimestamp = queryDate.getTime() / 1000;
                const endTimestamp = startTimestamp + 86400;

                stuff.dbObjects.UpcomingMeetings.findAndCountAll({
                    offset: page * stuff.config.search_limit,
                    limit: stuff.config.search_limit,
                    where: {
                        start_time: {
                            [stuff.dbObjects.seqOp.between]: [startTimestamp, endTimestamp]
                        }
                    }
                }).then(searchResults => {
                    stuff.meetingMan.sendSearchResult(stuff, searchResults.rows, 'Search by day - ' + queryDate.toLocaleDateString(stuff.config.locale), null, searchResults.count, page + 1);
                });
            } else {
                stuff.utils.sendUsage(stuff.message.channel, this.name + ' day', '[date] _(page)_');
            }
        } else if (stuff.args[0] == 'owner') {
            if (stuff.args.length >= 2 && stuff.message.mentions.members.length > 0) {
                stuff.dbObjects.UpcomingMeetings.findAndCountAll({
                    offset: page * stuff.config.search_limit,
                    limit: stuff.config.search_limit,
                    where: {
                        owner_id: {
                            [stuff.dbObjects.seqOp.eq]: stuff.message.mentions.members.first().id
                        }
                    }
                }).then(searchResults => {
                    stuff.meetingMan.sendSearchResult(stuff, searchResults.rows, 'Search by owner - @' + stuff.message.mentions.members.first().user.tag, null, searchResults.count, page + 1);
                });
            } else {
                stuff.utils.sendUsage(stuff.message.channel, this.name + ' owner', '[owner mention] _(page)_');
            }
        } else if (stuff.args[0] == 'name') {
            if (stuff.args.length >= 2) {
                stuff.dbObjects.UpcomingMeetings.findAndCountAll({
                    offset: page * stuff.config.search_limit,
                    limit: stuff.config.search_limit,
                    where: {
                        name: {
                            [stuff.dbObjects.seqOp.substring]: stuff.args[1]
                        }
                    }
                }).then(searchResults => {
                    stuff.meetingMan.sendSearchResult(stuff, searchResults.rows, 'Search by name - "' + stuff.args[1] + '"', null, searchResults.count, page + 1);
                });
            } else {
                stuff.utils.sendUsage(stuff.message.channel, this.name + ' name', '[meeting name] _(page)_');
            }
        } else {
            stuff.utils.sendUsage(stuff.message.channel, this.name, '[location/day/owner/name] [query] _(page)_');
        }
	},
};