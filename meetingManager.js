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

    this.sendSearchResult = function(stuff, result, title, footer = null, count = result.length, page = 1) {
        const constructedEmbed = new stuff.discord.RichEmbed();
        const maxPage = Math.ceil(count / stuff.config.search_limit);
        
        if (result.length > 0) {
            constructedEmbed.setColor('BLUE');

            var message = '';
            for (i = 0; i < result.length; i++) {
                const currentMeetingData = result[i].dataValues;
                const startTime = new Date(currentMeetingData.start_time * 1000);
                message = message.concat('**#' + currentMeetingData.id + ' - ' + currentMeetingData.name + '** ');
                message = message.concat(currentMeetingData.location_name_short + ', ' + startTime.toLocaleDateString(stuff.config.locale) + ' ' + startTime.toLocaleTimeString(stuff.config.locale, {hour: '2-digit', minute: '2-digit'}) + '\n');
            }

            var footerText = '';
            if (footer) {
                footerText = footerText.concat(footer + ' - ')
            }
            footerText = footerText.concat(count + (count > 1 ? ' results' : ' result'));
            if (count != result.length) {
                footerText = footerText.concat(', ' + result.length + ' shown');

                title = title.concat(' [' + page + '/' + maxPage + ']');
            }

            constructedEmbed.addField(title, message);
            constructedEmbed.setFooter(footerText);
        } else {
            constructedEmbed.setColor('RED');

            if (page > maxPage) {
                constructedEmbed.addField(title, 'This page does not exist. (Max. **' + maxPage + '**)');
            } else {
                constructedEmbed.addField(title, 'No result found.');
            }
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

    this.modifyMeetingName = function(stuff, id, name) {
        return new Promise(function(resolve, reject) {
            stuff.dbObjects.UpcomingMeetings.update(
                {name: name},
                {where: {id: id}}
            ).then(result => {
                if (result[0] > 0) {
                    resolve(name);
                } else {
                    reject();
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