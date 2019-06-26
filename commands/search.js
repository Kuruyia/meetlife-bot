module.exports = {
	name: 'search',
    description: 'Meeting search',
    
	execute(stuff) {
        if (stuff.args.length >= 1 && (stuff.args[0] == 'location' || stuff.args[0] == 'day' || stuff.args[0] == 'owner' || stuff.args[0] == 'name')) {
            if (stuff.args[0] == 'location') {
                if (stuff.args.length >= 2) {
                    stuff.dbObjects.UpcomingMeetings.findAll({
                        limit: 10,
                        where: {
                            location_name: {
                                [stuff.dbObjects.seqOp.substring]: stuff.args[1]
                            }
                        }
                    }).then(searchResults => {
                        stuff.meetingMan.sendSearchResult(stuff, searchResults, 'Search by location - "' + stuff.args[1] + '"');
                    });
                } else {
                    stuff.sendUsage(stuff.message.channel, this.name + ' search location', '[location]');
                }
            } else if (stuff.args[0] == 'day') {
                if (stuff.args.length >= 2) {
                    const chronoRes = stuff.chronode.parse(stuff.args[1]);

                    if (chronoRes.length == 0) {
                        stuff.sendError(stuff.message.channel, 'Unable to find a valid date in "' + stuff.args[1] + '"');
                        return;
                    }

                    const queryDate = chronoRes[0].start.date();
                    queryDate.setHours(0);
                    queryDate.setMinutes(0);
                    queryDate.setSeconds(0);

                    const startTimestamp = queryDate.getTime() / 1000;
                    const endTimestamp = startTimestamp + 86400;

                    stuff.dbObjects.UpcomingMeetings.findAll({
                        limit: 10,
                        where: {
                            start_time: {
                                [stuff.dbObjects.seqOp.between]: [startTimestamp, endTimestamp]
                            }
                        }
                    }).then(searchResults => {
                        stuff.meetingMan.sendSearchResult(stuff, searchResults, 'Search by day - ' + queryDate.toLocaleDateString(stuff.locale));
                    });
                } else {
                    stuff.sendUsage(stuff.message.channel, this.name + ' search day', '[date]');
                }
            } else if (stuff.args[0] == 'owner') {
                if (stuff.args.length >= 2) {
                    stuff.dbObjects.UpcomingMeetings.findAll({
                        limit: 10,
                        where: {
                            owner_id: {
                                [stuff.dbObjects.seqOp.eq]: stuff.message.mentions.members.first().id
                            }
                        }
                    }).then(searchResults => {
                        stuff.meetingMan.sendSearchResult(stuff, searchResults, 'Search by owner - @' + stuff.message.mentions.members.first().user.tag);
                    });
                } else {
                    stuff.sendUsage(stuff.message.channel, this.name + ' search owner', '[owner mention]');
                }
            } else if (stuff.args[0] == 'name') {
                if (stuff.args.length >= 2) {
                    stuff.dbObjects.UpcomingMeetings.findAll({
                        limit: 10,
                        where: {
                            name: {
                                [stuff.dbObjects.seqOp.substring]: stuff.args[1]
                            }
                        }
                    }).then(searchResults => {
                        stuff.meetingMan.sendSearchResult(stuff, searchResults, 'Search by name - "' + stuff.args[1] + '"');
                    });
                } else {
                    stuff.sendUsage(stuff.message.channel, this.name + ' search name', '[meeting name]');
                }
            }
        } else {
            stuff.sendUsage(stuff.message.channel, this.name, '[location/day/owner/name]');
        }
	},
};