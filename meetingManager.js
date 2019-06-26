module.exports = function() {
    this.addMeeting = function(stuff, name, feature, startDate, endDate, ownerId, joinLimit) {
        var locationLabel, locationName;
        if (feature.hasOwnProperty('properties') && feature.properties.hasOwnProperty('geocoding')) {
            if (feature.properties.geocoding.hasOwnProperty('label')) {
                locationLabel = feature.properties.geocoding.label;
            }
            if (feature.properties.geocoding.hasOwnProperty('name')) {
                locationName = feature.properties.geocoding.name;
            }
        }

        stuff.dbObjects.UpcomingMeetings.create({name: name,
            start_time: startDate,
            end_time: endDate,
            longitude: feature.geometry.coordinates[0],
            latitude: feature.geometry.coordinates[1],
            owner_id: ownerId,
            join_limit: joinLimit,
            location_name: locationLabel,
            location_name_short: locationName}).then(response => {
                this.sendInfoPanel(stuff, response.dataValues.id, '<@' + stuff.message.author.id + '> has created a new meeting!');
            });
    }

    this.sendSearchResult = function(stuff, result, title, footer) {
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
    }
    
    this.sendInfoPanel = function(stuff, id, message) {
        stuff.dbObjects.UpcomingMeetings.findOne({
            where: {
                id: id
            }
        }).then(result => {
            if (result) {
                const data = result.dataValues;
                const constructedEmbed = new stuff.discord.RichEmbed();
                constructedEmbed.setColor('BLUE');
                constructedEmbed.setTitle('📅   Meeting #' + data.id + ': ' + data.name);
                constructedEmbed.setURL('http://www.google.com/maps/place/' + data.latitude + ',' + data.longitude);

                if (data.end_time) {
                    var startDate = new Date(data.start_time * 1000);
                    var endDate = new Date(data.end_time * 1000);
                    constructedEmbed.addField('Date', stuff.utils.formatDate(startDate, endDate), true);
                } else {
                    var startDate = new Date(data.start_time * 1000);
                    constructedEmbed.addField('Date', stuff.utils.formatDate(startDate), true);
                }

                constructedEmbed.addField('Owner', '<@' + data.owner_id + '>', true)

                if (data.location_name_short) {
                    constructedEmbed.addField('Location', '**' + data.location_name_short + '**\n' + data.latitude + ', ' + data.longitude);
                } else {
                    constructedEmbed.addField('Location', data.latitude + ', ' + data.longitude);
                }

                if (message) {
                    stuff.message.channel.send(message, {embed: constructedEmbed});
                } else {
                    stuff.message.channel.send(constructedEmbed);
                }
            } else {
                stuff.utils.sendError(stuff.message.channel, 'Invalid meeting id.');
            }
        });
    }

    this.searchLocation = function(request, query) {
        const options = {
            url: 'https://nominatim.openstreetmap.org/search?q=' + encodeURI(query) + '&format=geocodejson&addressdetails=1',
            headers: {
                'User-Agent': 'LifeMeet 0.1'
            }
        };

        return new Promise(function(resolve, reject) {
            request(options, function(error, response, body) {
                if (!error && response.statusCode == 200) {
                    try {
                        const responseObj = JSON.parse(body);
                        resolve(responseObj);
                    } catch (e) {
                        reject("Error while parsing response: " + e);
                    }
                } else {
                    if (error) {
                        reject("An error has occured: " + error.toString());
                    } else {
                        reject("An unknown error has occured: HTTP " + response.statusCode.toString());
                    }
                }
            });
        });
    }

    this.modifyMeetingDate = function(stuff, id, startDate, endDate) {
        return new Promise(function(resolve, reject) {
            stuff.dbObjects.UpcomingMeetings.update({
                start_time: startDate,
                end_time: endDate
            },
            {
                where: {
                    id: id
                }
            }).then(result => {
                if (result[0] > 0) {
                    resolve({startDate: startDate,
                        endDate: endDate});
                } else {
                    reject();
                }
            });
        });
    }

    this.modifyMeetingLocation = function(stuff, id, feature) {
        var locationLabel, locationName;
        if (feature.hasOwnProperty('properties') && feature.properties.hasOwnProperty('geocoding')) {
            if (feature.properties.geocoding.hasOwnProperty('label')) {
                locationLabel = feature.properties.geocoding.label;
            }
            if (feature.properties.geocoding.hasOwnProperty('name')) {
                locationName = feature.properties.geocoding.name;
            }
        }

        return new Promise(function(resolve, reject) {
            stuff.dbObjects.UpcomingMeetings.update({
                longitude: feature.geometry.coordinates[0],
                latitude: feature.geometry.coordinates[1],
                location_name: locationLabel,
                location_name_short: locationName
            },
            {
                where: {
                    id: id
                }
            }).then(result => {
                if (result[0] > 0) {
                    resolve({longitude: feature.geometry.coordinates[0],
                        latitude: feature.geometry.coordinates[1],
                        label: locationLabel,
                        name: locationName});
                } else {
                    reject();
                }
            });
        });
    }
}