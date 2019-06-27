module.exports = {
	name: 'modify',
    description: 'Meeting modify',
    
	execute(stuff) {
        if (stuff.args.length >= 3) {
            const meetingId = parseInt(stuff.args[0]);
            if (!isNaN(meetingId)) {
                stuff.dbObjects.UpcomingMeetings.findOne({
                    where: {
                        id: meetingId
                    }
                }).then(result => {
                    if (result) {
                        const data = result.dataValues;
                        const ownerId = data.owner_id;

                        if (ownerId == stuff.message.author.id || stuff.message.member.hasPermission(stuff.discord.Permissions.FLAGS.MANAGE_MESSAGES)) {
                            module.exports.modifyMeeting(stuff, meetingId, ownerId != stuff.message.author.id && stuff.message.member.hasPermission(stuff.discord.Permissions.FLAGS.MANAGE_MESSAGES));
                        } else {
                            stuff.sendUtils.sendError(stuff.message.channel, stuff.message.author.id, 'You can\'t modify this meeting because you don\'t own it.');
                        }
                    } else {
                        stuff.sendUtils.sendError(stuff.message.channel, stuff.message.author.id, 'Invalid meeting id.');
                    }
                });
            } else {
                stuff.sendUtils.sendError(stuff.message.channel, stuff.message.author.id, 'Invalid meeting id.');
            }
        } else {
            stuff.sendUtils.sendUsage(stuff.message.channel, stuff.message.author.id, this.name, '[meeting id] [name/date/location] [query]');
        }
    },
    
    modifyMeeting(stuff, id, ownerOverriden) {
        if (stuff.args[1] == 'name') {
            if (stuff.args[2].length > 64) {
                stuff.sendUtils.sendError(stuff.message.channel, stuff.message.author.id, 'Meeting name might not exceed 64 characters.');
                return;
            }

            module.exports.modifyName(stuff, id, stuff.args[2], ownerOverriden);
        } else if (stuff.args[1] == 'date') {
            const chronoRes = stuff.chronode.parse(stuff.args[2]);
        
            if (chronoRes.length == 0) {
                stuff.sendUtils.sendError(stuff.message.channel, stuff.message.author.id, 'Unable to find a valid date in "' + stuff.args[2] + '"');
                return;
            }
        
            const startDate = chronoRes[0].start.date().getTime() / 1000;
            var endDate;
            if (chronoRes[0].end) {
                endDate = chronoRes[0].end.date().getTime() / 1000;
            }

            module.exports.modifyDate(stuff, id, startDate, endDate, ownerOverriden);
        } else if (stuff.args[1] == 'location') {
            stuff.meetingMan.searchLocation(stuff.request, stuff.args[2])
                .then(function(json) {
                    if (json.hasOwnProperty('features') && json.features.length > 0) {
                        if (json.features.length == 1) {
                            const actualFeature = json.features[0];
                            
                            if (actualFeature.hasOwnProperty('geometry') && actualFeature.geometry.hasOwnProperty('coordinates')) {
                                module.exports.modifyLocation(stuff, id, actualFeature, ownerOverriden);
                            } else {
                                stuff.sendUtils.sendError(stuff.dbObjects.UpcomingMeetings, stuff.message.channel, 'Unable to get GPS data from this place.')
                            }
                        } else {
                            var choiceTexts = [];
                            for (i = 0; i < json.features.length; i++) {
                                const actualFeature = json.features[i];
                                if (actualFeature.hasOwnProperty('properties') && actualFeature.properties.hasOwnProperty('geocoding') && actualFeature.properties.geocoding.hasOwnProperty('label')) {
                                    choiceTexts.push(actualFeature.properties.geocoding.label);
                                }
                            }
                            
                            stuff.choiceMan.addChoice(stuff.message.author.id, new stuff.choice('Location result for Meeting #' + id, choiceTexts, json.features, function(option, data) {
                                if (data[option].hasOwnProperty('geometry') && data[option].geometry.hasOwnProperty('coordinates')) {  
                                    module.exports.modifyLocation(stuff, id, data[option], ownerOverriden);
                                } else {
                                    stuff.sendUtils.sendError(stuff.message.channel, stuff.message.author.id, 'Unable to get GPS data from this place.')
                                }
                            }));
                            stuff.choiceMan.sendChoicesToChannel(stuff, stuff.message.author.id, stuff.message.channel, stuff.config.prefix, stuff.message.author.id);
                        }
                    } else {
                        stuff.sendUtils.sendError(stuff.message.channel, stuff.message.author.id, 'No place found for query "' + stuff.args[1] + '"');
                    } 
                })
                .catch(function(errorMessage) {
                    stuff.sendUtils.sendError(stuff.message.channel, stuff.message.author.id, errorMessage);
                });
        } else if (stuff.args[1] == 'limit') {
            const parsedLimit = parseInt(stuff.args[2]);
            if (!isNaN(parsedLimit) && parsedLimit >= 0) {
                module.exports.modifyLimit(stuff, id, parsedLimit, ownerOverriden)
            } else {
                stuff.sendUtils.sendError(stuff.message.channel, stuff.message.author.id, 'Invalid join limit: **' + stuff.args[2] + '**');
            }
        } else {
            stuff.sendUtils.sendUsage(stuff.message.channel, stuff.message.author.id, this.name + ' ' + stuff.args[0], '[name/date/location/limit] [query]');
        }
    },

    modifyName(stuff, id, name, ownerOverriden) {
        stuff.meetingMan.modifyMeetingName(id, name)
            .then(function(response) {
                stuff.sendUtils.sendConfirmation(stuff.message.channel, stuff.message.author.id, "New name: **" + response + '**', 'Name modified for Meeting #' + id, ownerOverriden ? 'Moderator mode - Owner verification has been bypassed' : null);
                stuff.sendUtils.notifyUsersInMeeting(stuff.client, 'The name of a meeting you have joined has been modified.', id);
            })
            .catch(function(e) {
                stuff.sendUtils.sendError(stuff.message.channel, stuff.message.author.id, 'Unable to modify the name of Meeting #' + id + '.');
                console.log(e);
            });
    },

    modifyDate(stuff, id, startDate, endDate, ownerOverriden) {
        stuff.meetingMan.modifyMeetingDate(id, startDate, endDate)
            .then(function(response) {
                const startDate = new Date(response.startDate * 1000);
                const actualTime = new Date().getTime() / 1000;
                var endDate;
                if (response.endDate) {
                    endDate = new Date(response.endDate * 1000);

                    if (endDate < startDate) {
                        stuff.sendUtils.sendError(stuff.message.channel, stuff.message.author.id, 'End date is before start date.');
                        return;
                    }
                }

                if (startDate < actualTime) {
                    stuff.sendUtils.sendError(stuff.message.channel, stuff.message.author.id, "You can't create a Meeting in the past.");
                    return;
                }

                stuff.sendUtils.sendConfirmation(stuff.message.channel, stuff.message.author.id, stuff.sendUtils.formatDate(startDate, endDate), 'Date modified for Meeting #' + id, ownerOverriden ? 'Moderator mode - Owner verification has been bypassed' : null);
                stuff.sendUtils.notifyUsersInMeeting(stuff.client, 'The date of a meeting you have joined has been modified.', id);
            })
            .catch(function(e) {
                stuff.sendUtils.sendError(stuff.message.channel, stuff.message.author.id, 'Unable to modify the date of Meeting #' + id + '.');
                console.log(e);
            });
    },

    modifyLocation(stuff, id, actualFeature, ownerOverriden) {
        stuff.meetingMan.modifyMeetingLocation(id, actualFeature)
            .then(function(response) {
                stuff.sendUtils.sendConfirmation(stuff.message.channel, stuff.message.author.id, response.name + '\n' + response.latitude + ', ' + response.longitude, 'Location modified for Meeting #' + id, ownerOverriden ? 'Moderator mode - Owner verification has been bypassed' : null);
                stuff.sendUtils.notifyUsersInMeeting(stuff.client, 'The location of a meeting you have joined has been modified.', id);
            })
            .catch(function(e) {
                stuff.sendUtils.sendError(stuff.message.channel, stuff.message.author.id, 'Unable to modify the location of Meeting #' + id + '.');
                console.log(e);
            });
    },

    modifyLimit(stuff, id, limit, ownerOverriden) {
        stuff.meetingMan.modifyMeetingLimit(id, limit)
            .then(function(response) {
                var message = response == 0 ? 'Join limit removed' : 'New join limit: **' + response + '**';
                stuff.sendUtils.sendConfirmation(stuff.message.channel, stuff.message.author.id, message, 'Join limit modified for Meeting #' + id, ownerOverriden ? 'Moderator mode - Owner verification has been bypassed' : null);
            })
            .catch(function(e) {
                stuff.sendUtils.sendError(stuff.message.channel, stuff.message.author.id, 'Unable to modify the join limit of Meeting #' + id + '.');
                console.log(e);
            });
    },
};