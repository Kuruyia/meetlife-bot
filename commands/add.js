module.exports = {
	name: 'add',
    description: 'Meeting add',
    
	execute(stuff) {
        if (stuff.args.length >= 3) {
            if (stuff.args[0].length > 64) {
                stuff.sendUtils.sendError(stuff.message.channel, stuff.message.author.id, 'Meeting name might not exceed 64 characters.');
                return;
            }

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

            var joinLimit = 0;
            if (stuff.args.length >= 4) {
                const parsedLimit = parseInt(stuff.args[3]);
                if (!isNaN(parsedLimit) && parsedLimit >= 0) {
                    joinLimit = parsedLimit;
                } else {
                    stuff.sendUtils.sendError(stuff.message.channel, stuff.message.author.id, 'Invalid join limit: **' + stuff.args[3] + '**');
                    return;
                }
            }
        
            stuff.meetingMan.searchLocation(stuff.request, stuff.args[1])
                .then(function(json) {
                    if (json.hasOwnProperty('features') && json.features.length > 0) {
                        if (json.features.length == 1) {
                            const actualFeature = json.features[0];
                            
                            if (actualFeature.hasOwnProperty('geometry') && actualFeature.geometry.hasOwnProperty('coordinates')) {  
                                stuff.meetingMan.addMeeting(stuff, stuff.args[0], actualFeature, startDate, endDate, stuff.message.author.id, joinLimit);
                            } else {
                                stuff.sendUtils.sendError(stuff.dbObjects.UpcomingMeetings, stuff.message.author.id, stuff.message.channel, 'Unable to get GPS data from this place.')
                            }
                        } else {
                            var choiceTexts = [];
                            for (i = 0; i < json.features.length; i++) {
                                const actualFeature = json.features[i];
                                if (actualFeature.hasOwnProperty('properties') && actualFeature.properties.hasOwnProperty('geocoding') && actualFeature.properties.geocoding.hasOwnProperty('label')) {
                                    choiceTexts.push(actualFeature.properties.geocoding.label);
                                }
                            }
                            
                            stuff.choiceMan.addChoice(stuff.message.author.id, new stuff.choice('Location results for new Meeting', choiceTexts, json.features, function(option, data) {
                                if (data[option].hasOwnProperty('geometry') && data[option].geometry.hasOwnProperty('coordinates')) {  
                                    stuff.meetingMan.addMeeting(stuff, stuff.args[0], data[option], startDate, endDate, stuff.message.author.id, joinLimit);
                                } else {
                                    stuff.sendUtils.sendError(stuff.message.channel, stuff.message.author.id, 'Unable to get GPS data from this place.')
                                }
                            }));
                            stuff.choiceMan.sendChoicesToChannel(stuff, stuff.message.channel, stuff.config.prefix, stuff.message.author.id);
                        }
                    } else {
                        stuff.sendUtils.sendError(stuff.message.channel, stuff.message.author.id, 'No place found for query "' + stuff.args[1] + '"');
                    } 
                })
                .catch(function(errorMessage) {
                    stuff.sendUtils.sendError(stuff.message.channel, stuff.message.author.id, errorMessage);
                });
        } else {
            stuff.sendUtils.sendUsage(stuff.message.channel, this.name, '[name] [location] [start _(and end)_ date] _(join limit)_');
        }
	},
};