module.exports = function() {
    this.addMeeting = function(stuff, name, feature, startDate, endDate, ownerId, joinLimit = 0) {
        var locationLabel, locationName;
        if (feature.hasOwnProperty('properties') && feature.properties.hasOwnProperty('geocoding')) {
            if (feature.properties.geocoding.hasOwnProperty('label')) {
                locationLabel = feature.properties.geocoding.label;
            }
            if (feature.properties.geocoding.hasOwnProperty('name')) {
                locationName = feature.properties.geocoding.name;
            }
        }

        stuff.dbObjects.UpcomingMeetings.create({
            name: name,
            start_time: startDate,
            end_time: endDate,
            longitude: feature.geometry.coordinates[0],
            latitude: feature.geometry.coordinates[1],
            owner_id: ownerId,
            join_limit: joinLimit,
            location_name: locationLabel,
            location_name_short: locationName
        }).then(response => {
            this.sendInfoPanel(stuff, response.dataValues.id, '<@' + stuff.message.author.id + '> has created a new meeting!');
        });
    }

    this.getMeetingData = function(stuff, id) {
        return new Promise((resolve, reject) => {
            stuff.dbObjects.UpcomingMeetings.findOne({
                where: {
                    id: id
                }
            }).then(result => {
                resolve(result);
            });
        });
    }

    this.sendSearchResult = function(stuff, result, title, footer = null, count = result.length, page = 1) {
        var resultList = [];
        for (i = 0; i < result.length; i++) {
            const currentMeetingData = result[i].dataValues;
            const startTime = new Date(currentMeetingData.start_time * 1000);

            var message = '';
            message = message.concat('**#' + currentMeetingData.id + ' - ' + currentMeetingData.name + '** ');
            message = message.concat(currentMeetingData.location_name_short + ', ' + startTime.toLocaleDateString(stuff.config.locale) + ' ' + startTime.toLocaleTimeString(stuff.config.locale, {hour: '2-digit', minute: '2-digit'}));

            resultList.push(message);
        }

        stuff.utils.sendPagedList(stuff.message.channel, resultList, title, footer, count, page);
    }
    
    this.sendInfoPanel = function(stuff, id, message) {
        stuff.dbObjects.UpcomingMeetings.findOne({
            where: {
                id: id
            }
        }).then(result => {
            if (result) {
                const data = result.dataValues;
                const self = this;
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
                    constructedEmbed.addField('Location', '**' + data.location_name_short + '**\n' + data.latitude + ', ' + data.longitude, true);
                } else {
                    constructedEmbed.addField('Location', data.latitude + ', ' + data.longitude, true);
                }

                this.countMeetingMembers(stuff, data.id)
                    .then(memberCount => {
                        return Promise.all([memberCount, self.hasUserJoinedMeeting(stuff, stuff.message.author.id, data.id)]);
                    }).then(result => {
                        const memberCount = result.shift();
                        const joined = result.shift();

                        var membersText = '';
                        if (joined) {
                            membersText = membersText.concat('**You are in this Meeting**\n');
                        }

                        membersText = membersText.concat(memberCount);
                        if (data.join_limit > 0) {
                            membersText = membersText.concat('/' + data.join_limit);
                        }
                        membersText = membersText.concat(' joined');
    
                        constructedEmbed.addField('Members', membersText, true);

                        if (message) {
                            stuff.message.channel.send(message, {embed: constructedEmbed});
                        } else {
                            stuff.message.channel.send(constructedEmbed);
                        }
                    });
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

    this.modifyMeetingLimit = function(stuff, id, limit) {
        return new Promise(function(resolve, reject) {
            stuff.dbObjects.UpcomingMeetings.update(
                {join_limit: limit},
                {where: {id: id}}
            ).then(result => {
                if (result[0] > 0) {
                    resolve(limit);
                } else {
                    reject();
                }
            });
        });
    }

    this.hasUserJoinedMeeting = function(stuff, userId, meetingId) {
        return new Promise((resolve, reject) => {
            stuff.dbObjects.JoinedMeetings.count({
                where: {
                    user_id: userId,
                    upcoming_meeting_id: meetingId
                }
            }).then(count => {
                resolve(count >= 1);
            });
        });
    }

    this.countMeetingMembers = function(stuff, meetingId) {
        return new Promise((resolve, reject) => {
            stuff.dbObjects.JoinedMeetings.count({
                where: {
                    upcoming_meeting_id: meetingId
                }
            }).then(joinCount => {
                resolve(joinCount);
            });
        });
    }

    this.isMeetingFull = function(stuff, meetingId) {
        return new Promise((resolve, reject) => {
            this.countMeetingMembers(stuff, meetingId).then(joinCount => {
                stuff.dbObjects.UpcomingMeetings.findOne({
                    where: {
                        id: meetingId
                    }
                }).then(result => {
                    const joinLimit = result.dataValues.join_limit;
                    resolve(joinLimit > 0 && joinCount >= joinLimit);
                });
            });
        });
    }

    this.doesMeetingExists = function(stuff, meetingId) {
        return new Promise((resolve, reject) => {
            stuff.dbObjects.UpcomingMeetings.count({
                where: {
                    id: meetingId
                }
            }).then(response => {
                resolve(response > 0);
            });
        });
    }

    this.joinUserToMeeting = function(stuff, userId, meetingId) {
        return new Promise((resolve, reject) => {
            this.doesMeetingExists(stuff, meetingId)
                .then(exists => {
                    if (exists) {
                        return this.hasUserJoinedMeeting(stuff, userId, meetingId);
                    } else {
                        throw 'This Meeting does not exist.';
                    }
                }).then(hasJoined => {
                    if (!hasJoined) {
                        return this.isMeetingFull(stuff, meetingId);
                    } else {
                        throw 'You already have joined this Meeting.';
                    }
                }).then(isFull => {
                    if (!isFull) {
                        stuff.dbObjects.JoinedMeetings.create({
                            user_id: userId,
                            upcoming_meeting_id: meetingId
                        }).then(response => {
                            resolve();
                        }).catch(error => {
                            reject(error);
                        });
                    } else {
                        throw 'This Meeting has reached its participant limit';
                    }
                }).catch(e => {
                    reject(e);
                });
        });
    }

    this.leaveUserFromMeeting = function(stuff, userId, meetingId) {
        return new Promise((resolve, reject) => {
            this.doesMeetingExists(stuff, meetingId)
                .then(exists => {
                    if (exists) {
                        return this.hasUserJoinedMeeting(stuff, userId, meetingId);
                    } else {
                        throw 'This Meeting does not exist.';
                    }
                }).then(hasJoined => {
                    if (hasJoined) {
                        return stuff.dbObjects.JoinedMeetings.destroy({
                            where: {
                                user_id: userId,
                                upcoming_meeting_id: meetingId
                            }
                        });
                    } else {
                        throw 'You are not in this Meeting.';
                    }
                }).then(result => {
                    resolve();
                }).catch(e => {
                    reject(e);
                });
        });
    }

    this.getUsersInMeeting = function(stuff, meetingId, limit = null, offset = null) {
        return new Promise((resolve, reject) => {
            stuff.dbObjects.JoinedMeetings.findAndCountAll({
                limit: limit,
                offset: offset,
                where: {
                    upcoming_meeting_id: meetingId
                }
            }).then(result => {
                var res = {count: result.count, users: []};
                for (i = 0; i < result.rows.length; i++) {
                    const data = result.rows[i].dataValues;
                    res.users.push(data.user_id);
                }

                console.log(res)
                resolve(res);
            }).catch(e => {
                reject(e);
            });
        })
    }
}