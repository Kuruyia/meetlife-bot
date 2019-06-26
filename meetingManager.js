module.exports = function() {
    this.addMeeting = function(stuff, name, feature, startDate, endDate, ownerId, joinLimit) {
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
}