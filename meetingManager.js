module.exports = function(dbObjects) {
    this.dbObjects = dbObjects;

    this.addMeeting = function(name, feature, startDate, endDate, ownerId, joinLimit = 0) {
        return new Promise((resolve, reject) => {
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
                resolve(response);
            }).catch(e => {
                reject(e);
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
}