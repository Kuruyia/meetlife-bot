module.exports = {
    name: 'meet',
    description: 'Meeting manager',
    
    execute: function(stuff) {
        if (stuff.args[0] == 'add') {
            if (stuff.args.length >= 4) {
                const chronoRes = stuff.chronode.parse(stuff.args[3]);

                if (chronoRes.length == 0) {
                    stuff.sendError(stuff.message.channel, 'Unable to find a valid date in "' + stuff.args[3] + '"');
                    return;
                }

                const startDate = chronoRes[0].start;
                const endDate = chronoRes[0].end;

                const options = {
                    url: 'https://nominatim.openstreetmap.org/search?q=' + encodeURI(stuff.args[2]) + '&format=geocodejson&addressdetails=1',
                    headers: {
                        'User-Agent': 'LifeMeet 0.1'
                    }
                };
                
                stuff.request(options, function (error, response, body) {
                    if (!error && response.statusCode == 200) {
                        try {
                            const responseObj = JSON.parse(body);
                            if (responseObj.hasOwnProperty('features') && responseObj.features.length > 0) {
                                if (responseObj.features.length == 1) {
                                    const actualFeature = responseObj.features[0];
                                    
                                    if (actualFeature.hasOwnProperty('geometry') && actualFeature.geometry.hasOwnProperty('coordinates')) {  
                                        module.exports.addMeeting(stuff, stuff.args[1], actualFeature, startDate, endDate, stuff.message.author.id, 0);
                                    } else {
                                        stuff.sendError(stuff.dbObjects.UpcomingMeetings, stuff.message.channel, 'Unable to get GPS data from this place.')
                                    }
                                } else {
                                    var choiceTexts = [];
                                    for (i = 0; i < responseObj.features.length; i++) {
                                        const actualFeature = responseObj.features[i];
                                        if (actualFeature.hasOwnProperty('properties') && actualFeature.properties.hasOwnProperty('geocoding') && actualFeature.properties.geocoding.hasOwnProperty('label')) {
                                            choiceTexts.push(actualFeature.properties.geocoding.label);
                                        }
                                    }
                                    
                                    stuff.choiceMan.addChoice(stuff.message.author.id, new stuff.choice(responseObj.features.length.toString() + ' matches for query "' + stuff.args[2] + '"', choiceTexts, responseObj.features, function(option, data) {
                                        if (data[option].hasOwnProperty('geometry') && data[option].geometry.hasOwnProperty('coordinates')) {  
                                            module.exports.addMeeting(stuff, stuff.args[1], data[option], startDate, endDate, stuff.message.author.id, 0);
                                        } else {
                                            stuff.sendError(stuff.message.channel, 'Unable to get GPS data from this place.')
                                        }
                                    }));
                                    stuff.choiceMan.sendChoicesToChannel(stuff.discord, stuff.message.channel, stuff.prefix, stuff.message.author.id);
                                }
                            } else {
                                stuff.sendError(stuff.message.channel, 'No place found for query "' + stuff.args[2] + '"');
                            }
                        } catch (e) {
                            stuff.sendError(stuff.message.channel, "Error while parsing response: " + e);
                        }
                    } else {
                        if (error) {
                            stuff.sendError(stuff.message.channel, "An error has occured: " + error.toString());
                        } else {
                            stuff.sendError(stuff.message.channel, "An unknown error has occured: HTTP " + response.statusCode.toString());
                        }
                    }
                });
            } else {
                stuff.sendUsage(stuff.message.channel, this.name + ' add', '[name] [location] [start _(and end)_ date]');
            }
        } else if (stuff.args[0] == 'list') {
            if (!stuff.args[1] || stuff.args[1] == 'asc' || stuff.args[1] == 'desc') {
                stuff.dbObjects.UpcomingMeetings.findAll({
                    limit: 10,
                    order: [[stuff.dbObjects.sequelize.col('start_time'), stuff.args[1] == 'desc' ? 'DESC' : 'ASC']]
                }).then(upcomingMeetings => {
                    module.exports.sendSearchResult(stuff, upcomingMeetings, 'Upcoming meeting list', stuff.args[1] == 'desc' ? 'Sorted from descending order' : 'Sorted from ascending order');
                });
            } else {
                stuff.sendUsage(stuff.message.channel, this.name + ' list', '_(asc/desc)_');
            }
        } else if (stuff.args[0] == 'search') {
            if (stuff.args.length >= 2 && (stuff.args[1] == 'location' || stuff.args[1] == 'day' || stuff.args[1] == 'owner' || stuff.args[1] == 'name')) {
                if (stuff.args[1] == 'location') {
                    if (stuff.args.length >= 3) {
                        stuff.dbObjects.UpcomingMeetings.findAll({
                            limit: 10,
                            where: {
                                location_name: {
                                    [stuff.dbObjects.seqOp.substring]: stuff.args[2]
                                }
                            }
                        }).then(searchResults => {
                            module.exports.sendSearchResult(stuff, searchResults, 'Search by location - "' + stuff.args[2] + '"');
                        });
                    } else {
                        stuff.sendUsage(stuff.message.channel, this.name + ' search location', '[location]');
                    }
                } else if (stuff.args[1] == 'day') {
                    if (stuff.args.length >= 3) {
                        const chronoRes = stuff.chronode.parse(stuff.args[2]);

                        if (chronoRes.length == 0) {
                            stuff.sendError(stuff.message.channel, 'Unable to find a valid date in "' + stuff.args[2] + '"');
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
                            module.exports.sendSearchResult(stuff, searchResults, 'Search by day - ' + queryDate.toLocaleDateString(stuff.locale));
                        });
                    } else {
                        stuff.sendUsage(stuff.message.channel, this.name + ' search day', '[date]');
                    }
                } else if (stuff.args[1] == 'owner') {
                    if (stuff.args.length >= 3) {
                        stuff.dbObjects.UpcomingMeetings.findAll({
                            limit: 10,
                            where: {
                                owner_id: {
                                    [stuff.dbObjects.seqOp.eq]: stuff.message.mentions.members.first().id
                                }
                            }
                        }).then(searchResults => {
                            module.exports.sendSearchResult(stuff, searchResults, 'Search by owner - @' + stuff.message.mentions.members.first().user.tag);
                        });
                    } else {
                        stuff.sendUsage(stuff.message.channel, this.name + ' search owner', '[owner mention]');
                    }
                } else if (stuff.args[1] == 'name') {
                    if (stuff.args.length >= 3) {
                        stuff.dbObjects.UpcomingMeetings.findAll({
                            limit: 10,
                            where: {
                                name: {
                                    [stuff.dbObjects.seqOp.substring]: stuff.args[2]
                                }
                            }
                        }).then(searchResults => {
                            module.exports.sendSearchResult(stuff, searchResults, 'Search by name - "' + stuff.args[2] + '"');
                        });
                    } else {
                        stuff.sendUsage(stuff.message.channel, this.name + ' search name', '[meeting name]');
                    }
                }
            } else {
                stuff.sendUsage(stuff.message.channel, this.name + ' search', '[location/day/owner/name]');
            }
        } else if (stuff.args[0] == 'info') {
            if (stuff.args.length >= 2) {
                const meetingId = parseInt(stuff.args[1]);
                if (!isNaN(meetingId)) {
                    module.exports.sendInfoPanel(stuff, meetingId);
                } else {
                    stuff.sendError(stuff.message.channel, 'Invalid meeting id.');
                }
            } else {
                stuff.sendUsage(stuff.message.channel, this.name + ' info', '[meeting id]');
            }
        } else if (stuff.args.length == 0) {
            stuff.sendUsage(stuff.message.channel, this.name, ['add [name] [location] [start _(and end)_ date]', 'list _(asc/desc)_', 'search [location/day/owner/name]', 'info [meeting id]']);
        } else {
            stuff.sendError(stuff.message.channel, 'Unknown option: **' + stuff.args[0] + '**');
        }
    },

    addMeeting: function(stuff, name, feature, startDate, endDate, ownerId, joinLimit) {
        endTime = null;
        if (endDate) {
            endTime = endDate.date().getTime() / 1000;
        }

        stuff.dbObjects.UpcomingMeetings.create({name: name,
            start_time: startDate.date().getTime() / 1000,
            end_time: endTime,
            longitude: feature.geometry.coordinates[0],
            latitude: feature.geometry.coordinates[1],
            owner_id: ownerId,
            join_limit: joinLimit,
            location_name: feature.properties.geocoding.label,
            location_name_short: feature.properties.geocoding.name}).then(response => {
                module.exports.sendInfoPanel(stuff, response.dataValues.id, '<@' + stuff.message.author.id + '> has created a new meeting!');
            });
    },

    sendSearchResult: function(stuff, result, title, footer) {
        const constructedEmbed = new stuff.discord.RichEmbed();
        
        if (result.length > 0) {
            constructedEmbed.setColor('BLUE');

            var message = '';
            for (i = 0; i < result.length; i++) {
                const currentMeetingData = result[i].dataValues;
                message = message.concat('**#' + currentMeetingData.id + '**: ' + currentMeetingData.name + ' - ' + new Date(currentMeetingData.start_time * 1000).toLocaleString(stuff.locale) + '\n');
            }

            constructedEmbed.addField(title, message);
            if (footer) {
                constructedEmbed.setFooter(footer + ' - ' + result.length + (result.length > 1 ? ' results' : ' result'));
            } else {
                constructedEmbed.setFooter(result.length + (result.length > 1 ? ' results' : ' result'))
            }
        } else {
            constructedEmbed.setColor('RED');
            constructedEmbed.addField(title, 'No result found');
        }

        stuff.message.channel.send(constructedEmbed);
    },

    sendInfoPanel: function(stuff, id, message) {
        stuff.dbObjects.UpcomingMeetings.findOne({
            where: {
                id: id
            }
        }).then(result => {
            if (result) {
                const data = result.dataValues;
                const constructedEmbed = new stuff.discord.RichEmbed();
                constructedEmbed.setColor('BLUE');
                constructedEmbed.setTitle('Meeting #' + data.id + ': ' + data.name);
                constructedEmbed.setURL('http://www.google.com/maps/place/' + data.latitude + ',' + data.longitude);

                var dateStr = new Date(data.start_time * 1000).toLocaleString(stuff.locale);
                if (data.end_time) {
                    dateStr = dateStr.concat(' - ' + new Date(data.end_time * 1000).toLocaleString(stuff.locale));
                }
                constructedEmbed.addField('Date', dateStr, true);

                constructedEmbed.addField('Owner', '<@' + data.owner_id + '>', true)

                if (data.location_name_short) {
                    constructedEmbed.addField('Location', data.location_name_short + '\n' + data.latitude + ', ' + data.longitude);
                } else {
                    constructedEmbed.addField('Location', data.latitude + ', ' + data.longitude);
                }

                if (message) {
                    stuff.message.channel.send(message, {embed: constructedEmbed});
                } else {
                    stuff.message.channel.send(constructedEmbed);
                }
            } else {
                stuff.sendError(stuff.message.channel, 'Invalid meeting id.');
            }
        });
    }
};