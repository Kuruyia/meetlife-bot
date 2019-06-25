module.exports = {
	name: 'test',
	description: 'Functionnality tester',
	execute(stuff) {
        /*var results = chronode.parse(args.join(' '));
        
        message.channel.send(results[0].start.date().toString());*/
        console.log(stuff.args);
        const options = {
            url: 'https://nominatim.openstreetmap.org/search?q=' + encodeURI(stuff.args[0]) + '&format=geocodejson&addressdetails=1',
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

                            stuff.choiceMan.addChoice(stuff.message.author.id, new stuff.choice(responseObj.features.length.toString() + ' matches for query "' + stuff.args[0] + '"', choiceTexts, responseObj.features, function(option) {

                            }));
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
	},
};