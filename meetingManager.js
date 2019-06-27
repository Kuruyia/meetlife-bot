module.exports = function(dbObjects) {
    this.dbObjects = dbObjects;

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

        this.dbObjects.UpcomingMeetings.create({
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
            this.sendInfoPanel(stuff, stuff.message.channel, response.dataValues.id, '<@' + stuff.message.author.id + '> has created a new meeting!');
        });
    }

    this.getMeetingData = function(id) {
        return new Promise((resolve, reject) => {
            this.dbObjects.UpcomingMeetings.findOne({
                where: {
                    id: id
                }
            }).then(result => {
                resolve(result);
            }).catch(e => {
                reject(e);
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

    this.sendInfoPanelFromData = function(stuff, channel, data, message) {
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

        this.countMeetingMembers(data.id)
            .then(memberCount => {
                return Promise.all([memberCount, this.hasUserJoinedMeeting(stuff.message.author.id, data.id)]);
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
                    channel.send(message, {embed: constructedEmbed});
                } else {
                    channel.send(constructedEmbed);
                }
            });
    }
    
    this.sendInfoPanel = function(stuff, channel, id, message) {
        this.getMeetingData(id)
            .then(result => {
                if (result) {
                    this.sendInfoPanelFromData(stuff, channel, result.dataValues, message);
                } else {
                    stuff.utils.sendError(channel, 'Invalid meeting id.');
                }
            }).catch(e => {
                stuff.utils.sendError(channel, 'An error has occured: ' + e);
            });
    }

    this.sendMeetingMembersPanel = function(stuff, client, meetingId, page = 0) {
        this.getUsersInMeeting(meetingId, stuff.config.search_limit, stuff.config.search_limit * page)
            .then(result => {
                if (result.count > 0) {
                    var textList = [];
                    for (i = 0; i < result.users.length; i++) {
                        textList.push('<@' + result.users[i] + '>');
                    }

                    stuff.utils.sendPagedList(stuff.message.channel, textList, 'Members in Meeting #' + meetingId, null, result.count, page + 1);
                } else {
                    stuff.utils.sendConfirmation(stuff.message.channel, 'No user has joined this Meeting.', 'Members in Meeting #' + meetingId);
                }
            }).catch(e => {
                stuff.utils.sendError(stuff.message.channel, 'An error has occured: ' + e);
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

    this.modifyMeetingName = function(id, name) {
        return new Promise((resolve, reject) => {
            this.dbObjects.UpcomingMeetings.update(
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

    this.modifyMeetingDate = function(id, startDate, endDate) {
        return new Promise(function(resolve, reject) {
            this.dbObjects.UpcomingMeetings.update({
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

    this.modifyMeetingLocation = function(id, feature) {
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
            this.dbObjects.UpcomingMeetings.update({
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

    this.modifyMeetingLimit = function(id, limit) {
        return new Promise(function(resolve, reject) {
            this.dbObjects.UpcomingMeetings.update(
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

    this.hasUserJoinedMeeting = function(userId, meetingId) {
        return new Promise((resolve, reject) => {
            this.dbObjects.JoinedMeetings.count({
                where: {
                    user_id: userId,
                    upcoming_meeting_id: meetingId
                }
            }).then(count => {
                resolve(count >= 1);
            });
        });
    }

    this.countMeetingMembers = function(meetingId) {
        return new Promise((resolve, reject) => {
            this.dbObjects.JoinedMeetings.count({
                where: {
                    upcoming_meeting_id: meetingId
                }
            }).then(joinCount => {
                resolve(joinCount);
            });
        });
    }

    this.isMeetingFull = function(meetingId) {
        return new Promise((resolve, reject) => {
            this.countMeetingMembers(meetingId).then(joinCount => {
                this.dbObjects.UpcomingMeetings.findOne({
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

    this.doesMeetingExists = function(meetingId) {
        return new Promise((resolve, reject) => {
            this.dbObjects.UpcomingMeetings.count({
                where: {
                    id: meetingId
                }
            }).then(response => {
                resolve(response > 0);
            });
        });
    }

    this.joinUserToMeeting = function(userId, meetingId) {
        return new Promise((resolve, reject) => {
            this.doesMeetingExists(meetingId)
                .then(exists => {
                    if (exists) {
                        return this.hasUserJoinedMeeting(userId, meetingId);
                    } else {
                        throw 'This Meeting does not exist.';
                    }
                }).then(hasJoined => {
                    if (!hasJoined) {
                        return this.isMeetingFull(meetingId);
                    } else {
                        throw 'You already have joined this Meeting.';
                    }
                }).then(isFull => {
                    if (!isFull) {
                        this.dbObjects.JoinedMeetings.create({
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

    this.leaveUserFromMeeting = function(userId, meetingId) {
        return new Promise((resolve, reject) => {
            this.doesMeetingExists(meetingId)
                .then(exists => {
                    if (exists) {
                        return this.hasUserJoinedMeeting(userId, meetingId);
                    } else {
                        throw 'This Meeting does not exist.';
                    }
                }).then(hasJoined => {
                    if (hasJoined) {
                        return this.dbObjects.JoinedMeetings.destroy({
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

    this.getUsersInMeeting = function(meetingId, limit = null, offset = null) {
        return new Promise((resolve, reject) => {
            this.dbObjects.JoinedMeetings.findAndCountAll({
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

                resolve(res);
            }).catch(e => {
                reject(e);
            });
        })
    }

    this.notifyUsers = function(stuff, client, meetingId, userIdList, message, data = null) {
        var usersLookup = [];
        for (i = 0; i < userIdList.length; i++) {
            const actualPromise = client.fetchUser(userIdList[i]);
            actualPromise.catch(() => undefined);

            usersLookup.push(actualPromise);
        }

        Promise.all(usersLookup)
            .then(result => {
                for (i = 0; i < result.length; i++) {
                    stuff.utils.sendConfirmation(result[i], message, 'Notification');
                    if (data) {
                        this.sendInfoPanelFromData(stuff, result[i], data);
                    } else {
                        this.sendInfoPanel(stuff, result[i], meetingId);
                    }
                }
            });
    }

    this.notifyUsersInMeeting = function(stuff, client, meetingId, message, data = null) {
        this.getUsersInMeeting(meetingId)
            .then(result => {
                this.notifyUsers(stuff, client, meetingId, result.users, message, data)
            }).catch(e => {
                console.log('Error while notifying users: ' + e);
            });
    }
}