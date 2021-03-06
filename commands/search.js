module.exports = {
	name: 'search',
    description: 'Search for Meetings based on a criteria',
    url: 'https://github.com/Arc13/meetlife-bot/wiki/1.14-"Search"-command',
    
	execute(stuff) {
        var page = 0;
        const actualTime = new Date().getTime() / 1000;
        
        if (stuff.args.length >= 3) {
            const parsedPage = parseInt(stuff.args[2]);

            if (!isNaN(parsedPage) && parsedPage > 0) {
                page = parsedPage - 1;
            } else {
                stuff.sendUtils.sendError(stuff.message.channel, stuff.message.author.id, 'Invalid page: **' + stuff.args[2] + '**');
                return;
            }
        }

        if (!stuff.message.guild || !stuff.message.guild.available) {
            stuff.sendUtils.sendError(stuff.dbObjects.UpcomingMeetings, stuff.message.author.id, stuff.message.channel, 'Guild is not available for this operation.')
            return;
        }
        const guildId = stuff.message.guild.id;
        
        if (stuff.args[0] == 'location') {
            if (stuff.args.length >= 2) {
                stuff.dbObjects.UpcomingMeetings.findAndCountAll({
                    offset: page * stuff.config.search_limit,
                    limit: stuff.config.search_limit,
                    where: {
                        location_name: {
                            [stuff.dbObjects.seqOp.substring]: stuff.args[1]
                        },
                        start_time: {
                            [stuff.dbObjects.seqOp.gt]: actualTime
                        },
                        guild_id: guildId
                    }
                }).then(searchResults => {
                    stuff.sendUtils.sendSearchResult(stuff.message.channel, stuff.message.author.id, searchResults.rows, 'Search by location - "' + stuff.args[1] + '"', null, searchResults.count, page + 1);
                });
            } else {
                stuff.sendUtils.sendUsage(stuff.message.channel, stuff.message.author.id, this.name + ' location', '[location] _(page)_');
            }
        } else if (stuff.args[0] == 'day') {
            if (stuff.args.length >= 2) {
                const chronoRes = stuff.chronode.parse(stuff.args[1]);

                if (chronoRes.length == 0) {
                    stuff.sendUtils.sendError(stuff.message.channel, stuff.message.author.id, 'Unable to find a valid date in **' + stuff.args[1] + '**');
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
                        },
                        guild_id: guildId
                    }
                }).then(searchResults => {
                    stuff.sendUtils.sendSearchResult(stuff.message.channel, stuff.message.author.id, searchResults.rows, 'Search by day - ' + queryDate.toLocaleDateString(stuff.config.locale), null, searchResults.count, page + 1);
                });
            } else {
                stuff.sendUtils.sendUsage(stuff.message.channel, stuff.message.author.id, this.name + ' day', '[date] _(page)_');
            }
        } else if (stuff.args[0] == 'owner') {
            if (stuff.args.length >= 2 && stuff.message.mentions.users.size > 0) {
                stuff.dbObjects.UpcomingMeetings.findAndCountAll({
                    offset: page * stuff.config.search_limit,
                    limit: stuff.config.search_limit,
                    where: {
                        owner_id: {
                            [stuff.dbObjects.seqOp.eq]: stuff.message.mentions.users.first().id
                        },
                        start_time: {
                            [stuff.dbObjects.seqOp.gt]: actualTime
                        },
                        guild_id: guildId
                    }
                }).then(searchResults => {
                    stuff.sendUtils.sendSearchResult(stuff.message.channel, stuff.message.author.id, searchResults.rows, 'Search by owner - @' + stuff.message.mentions.members.first().user.tag, null, searchResults.count, page + 1);
                });
            } else {
                stuff.sendUtils.sendUsage(stuff.message.channel, stuff.message.author.id, this.name + ' owner', '[owner mention] _(page)_');
            }
        } else if (stuff.args[0] == 'name') {
            if (stuff.args.length >= 2) {
                stuff.dbObjects.UpcomingMeetings.findAndCountAll({
                    offset: page * stuff.config.search_limit,
                    limit: stuff.config.search_limit,
                    where: {
                        name: {
                            [stuff.dbObjects.seqOp.substring]: stuff.args[1]
                        },
                        start_time: {
                            [stuff.dbObjects.seqOp.gt]: actualTime
                        },
                        guild_id: guildId
                    }
                }).then(searchResults => {
                    stuff.sendUtils.sendSearchResult(stuff.message.channel, stuff.message.author.id, searchResults.rows, 'Search by name - "' + stuff.args[1] + '"', null, searchResults.count, page + 1);
                });
            } else {
                stuff.sendUtils.sendUsage(stuff.message.channel, stuff.message.author.id, this.name + ' name', '[meeting name] _(page)_');
            }
        } else {
            stuff.sendUtils.sendUsage(stuff.message.channel, stuff.message.author.id, this.name, '[location/day/owner/name] [query] _(page)_');
        }
    },
    
    getHelp(args) {
        if (args.length == 0) {
            const argsList = [
                {name: 'location/day/owner/name', description: 'Type of search'},
                {name: 'query', description: 'Argument to modify the value\nAdd one of the values in the help command for more details'},
                {name: 'page', description: 'Number of the page to show', optional: true},
            ];

            return {command: this.name, args: argsList};
        } else {
            if (args[0] == 'location') {
                const argsList = [
                    {name: 'location', description: 'Type of search set to location'},
                    {name: 'query', description: 'Text that will be searched in every Meeting location\nThis searches for the long location, meaning that you can input a city name for instance'},
                    {name: 'page', description: 'Number of the page to show', optional: true},
                ];
    
                return {command: this.name, args: argsList};
            } else if (args[0] == 'day') {
                const argsList = [
                    {name: 'day', description: 'Type of search set to day'},
                    {name: 'query', description: 'Day that will be used to search for matching Meetings\nThis is compatible with natural date typing'},
                    {name: 'page', description: 'Number of the page to show', optional: true},
                ];
    
                return {command: this.name, args: argsList};
            } else if (args[0] == 'owner') {
                const argsList = [
                    {name: 'owner', description: 'Type of search set to owner'},
                    {name: 'query: mention', description: 'Mention that will be used to search for every Meeting owned by this user'},
                    {name: 'page', description: 'Number of the page to show', optional: true},
                ];
    
                return {command: this.name, args: argsList};
            } else if (args[0] == 'name') {
                const argsList = [
                    {name: 'name', description: 'Type of search set to name'},
                    {name: 'query', description: 'Text that will be searched in every Meeting name'},
                    {name: 'page', description: 'Number of the page to show', optional: true},
                ];
    
                return {command: this.name, args: argsList};
            }
        }
    },
};