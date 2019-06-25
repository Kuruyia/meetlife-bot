module.exports = {
    name: 'meet',
    description: 'Meeting manager',
    
    execute(stuff) {
        if (stuff.args[0] == 'add') {
            if (stuff.args.length >= 3) {
                const chronoRes = stuff.chronode.parse(stuff.args[2]);

                if (chronoRes.length == 0) {
                    stuff.sendError(stuff.message.channel, 'Unable to find a valid date in "' + stuff.args[2] + '"');
                    return;
                }

                const startDate = chronoRes[0].start;
                const endDate = chronoRes[0].end;

                const options = {
                    url: 'https://nominatim.openstreetmap.org/search?q=' + encodeURI(stuff.args[1]) + '&format=geocodejson&addressdetails=1',
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
                                    const constructedEmbed = new stuff.discord.RichEmbed();
                                    constructedEmbed.setColor('BLUE');
                                    
                                    if (actualFeature.hasOwnProperty('properties') && actualFeature.properties.hasOwnProperty('geocoding') && actualFeature.properties.geocoding.hasOwnProperty('label')) {  
                                        constructedEmbed.addField('<unique result>', actualFeature.properties.geocoding.label);
                                    }
                                    
                                    stuff.message.channel.send(constructedEmbed);
                                } else {
                                    var choiceTexts = [];
                                    for (i = 0; i < responseObj.features.length; i++) {
                                        const actualFeature = responseObj.features[i];
                                        if (actualFeature.hasOwnProperty('properties') && actualFeature.properties.hasOwnProperty('geocoding') && actualFeature.properties.geocoding.hasOwnProperty('label')) {
                                            choiceTexts.push(actualFeature.properties.geocoding.label);
                                        }
                                    }
                                    
                                    stuff.choiceMan.addChoice(stuff.message.author.id, new stuff.choice(responseObj.features.length.toString() + ' matches for query "' + stuff.args[1] + '"', choiceTexts, responseObj.features, function(option) {
                                        
                                    }));
                                    stuff.choiceMan.sendChoicesToChannel(stuff.discord, stuff.message.channel, stuff.prefix, stuff.message.author.id);
                                }
                            } else {
                                stuff.sendError(stuff.message.channel, 'No place found for query "' + stuff.args[0] + '"');
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
                stuff.sendUsage(stuff.message.channel, this.name + ' add', '[location] [start _(and end)_ date]');
            }
        } else if (stuff.args.length == 0) {
            stuff.sendUsage(stuff.message.channel, this.name, ['add [location] [start _(and end)_ date]']);
        } else {
            stuff.sendError(stuff.message.channel, 'Unknown option: **' + stuff.args[0] + '**');
        }
    },
};