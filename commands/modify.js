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
                            stuff.utils.sendError(stuff.message.channel, 'You can\'t modify this meeting because you don\'t own it.');
                        }
                    } else {
                        stuff.utils.sendError(stuff.message.channel, 'Invalid meeting id.');
                    }
                });
            } else {
                stuff.utils.sendError(stuff.message.channel, 'Invalid meeting id.');
            }
        } else {
            stuff.utils.sendUsage(stuff.message.channel, this.name, '[meeting id] [name/date/location] [query]');
        }
    },
    
    modifyMeeting(stuff, id, ownerOverriden) {
        if (stuff.args[1] == 'name') {
            module.exports.modifyName(stuff, id, stuff.args[2], ownerOverriden);
        } else if (stuff.args[1] == 'date') {
            const chronoRes = stuff.chronode.parse(stuff.args[2]);
        
            if (chronoRes.length == 0) {
                stuff.utils.sendError(stuff.message.channel, 'Unable to find a valid date in "' + stuff.args[2] + '"');
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
                                stuff.utils.sendError(stuff.dbObjects.UpcomingMeetings, stuff.message.channel, 'Unable to get GPS data from this place.')
                            }
                        } else {
                            var choiceTexts = [];
                            for (i = 0; i < json.features.length; i++) {
                                const actualFeature = json.features[i];
                                if (actualFeature.hasOwnProperty('properties') && actualFeature.properties.hasOwnProperty('geocoding') && actualFeature.properties.geocoding.hasOwnProperty('label')) {
                                    choiceTexts.push(actualFeature.properties.geocoding.label);
                                }
                            }
                            
                            stuff.choiceMan.addChoice(stuff.message.author.id, new stuff.choice(json.features.length.toString() + ' matches for query "' + stuff.args[1] + '"', choiceTexts, json.features, function(option, data) {
                                if (data[option].hasOwnProperty('geometry') && data[option].geometry.hasOwnProperty('coordinates')) {  
                                    module.exports.modifyLocation(stuff, id, data[option], ownerOverriden);
                                } else {
                                    stuff.utils.sendError(stuff.message.channel, 'Unable to get GPS data from this place.')
                                }
                            }));
                            stuff.choiceMan.sendChoicesToChannel(stuff.discord, stuff.message.channel, stuff.config.prefix, stuff.message.author.id);
                        }
                    } else {
                        stuff.utils.sendError(stuff.message.channel, 'No place found for query "' + stuff.args[1] + '"');
                    } 
                })
                .catch(function(errorMessage) {
                    stuff.utils.sendError(stuff.message.channel, errorMessage);
                });
        } else {
            stuff.utils.sendUsage(stuff.message.channel, this.name + ' ' + stuff.args[0], '[name/date/location] [query]');
        }
    },

    modifyName(stuff, id, name, ownerOverriden) {
        stuff.meetingMan.modifyMeetingName(stuff, id, name)
            .then(function(response) {
                stuff.utils.sendConfirmation(stuff.message.channel, "New name: **" + response + '**', 'Name modified for Meeting #' + id, ownerOverriden ? 'Moderator mode - Owner verification has been bypassed' : null);
            })
            .catch(function(e) {
                stuff.utils.sendError(stuff.message.channel, 'Unable to modify the name of Meeting #' + id + '.');
                console.log(e);
            });
    },

    modifyDate(stuff, id, startDate, endDate, ownerOverriden) {
        stuff.meetingMan.modifyMeetingDate(stuff, id, startDate, endDate)
            .then(function(response) {
                const startDate = new Date(response.startDate * 1000);
                var endDate;
                if (response.endDate) {
                    endDate = new Date(response.endDate * 1000);
                }

                stuff.utils.sendConfirmation(stuff.message.channel, stuff.utils.formatDate(startDate, endDate), 'Date modified for Meeting #' + id, ownerOverriden ? 'Moderator mode - Owner verification has been bypassed' : null);
            })
            .catch(function(e) {
                stuff.utils.sendError(stuff.message.channel, 'Unable to modify the date of Meeting #' + id + '.');
                console.log(e);
            });
    },

    modifyLocation(stuff, id, actualFeature, ownerOverriden) {
        stuff.meetingMan.modifyMeetingLocation(stuff, id, actualFeature)
            .then(function(response) {
                stuff.utils.sendConfirmation(stuff.message.channel, response.name + '\n' + response.latitude + ', ' + response.longitude, 'Location modified for Meeting #' + id, ownerOverriden ? 'Moderator mode - Owner verification has been bypassed' : null);
            })
            .catch(function(e) {
                stuff.utils.sendError(stuff.message.channel, 'Unable to modify the location of Meeting #' + id + '.');
                console.log(e);
            });
    },
};