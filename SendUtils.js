module.exports = function(discord, meetingManager, prefix, locale, listLimit) {
    this.discord = discord;
    this.meetingManager = meetingManager;
    this.prefix = prefix;
    this.locale = locale;
    this.listLimit = listLimit;

    this.sendError = function(channel, authorId, message, title = 'Error') {
        const constructedEmbed = new this.discord.RichEmbed();
        constructedEmbed.setColor('RED');
        constructedEmbed.addField(title, message);
    
        if (authorId) {
            channel.send('<@' + authorId + '>', {embed: constructedEmbed});
        } else {
            channel.send(constructedEmbed);
        }
    },
    
    this.sendConfirmation = function(channel, authorId, message, title = 'Confirmation', footer = null) {
        const constructedEmbed = new this.discord.RichEmbed();
        constructedEmbed.setColor('BLUE');
        constructedEmbed.addField(title, message);

        if (footer) {
            constructedEmbed.setFooter(footer);
        }
    
        if (authorId) {
            channel.send('<@' + authorId + '>', {embed: constructedEmbed});
        } else {
            channel.send(constructedEmbed);
        }
    },
    
    this.sendUsage = function(channel, authorId, command, message) {
        const constructedEmbed = new this.discord.RichEmbed();
        constructedEmbed.setColor('ORANGE');
        
        if (Array.isArray(message)) {
            var genText = '';
            for (i = 0; i < message.length; i++) {
                genText = genText.concat('**' + this.prefix + command + '** ' + message[i] + '\n');
            }
    
            constructedEmbed.addField('Usage', genText);
        } else {
            constructedEmbed.addField('Usage', '**' + this.prefix + command + '** ' + message);
        }
    
        if (authorId) {
            channel.send('<@' + authorId + '>', {embed: constructedEmbed});
        } else {
            channel.send(constructedEmbed);
        }
    },

    this.sendPagedList = function(channel, authorId, textList, title, footer = null, count = textList.length, page = 1) {
        const constructedEmbed = new this.discord.RichEmbed();
        const maxPage = Math.ceil(count / this.listLimit);
        
        if (textList.length > 0) {
            constructedEmbed.setColor('BLUE');

            var footerText = '';
            if (footer) {
                footerText = footerText.concat(footer + ' - ')
            }
            footerText = footerText.concat(count + (count > 1 ? ' results' : ' result'));
            if (count != textList.length) {
                footerText = footerText.concat(', ' + textList.length + ' shown');
                title = title.concat(' [' + page + '/' + maxPage + ']');
            }

            var textLength = 0;
            var message = '';
            var isFirstField = true;
            for (i = 0; i < textList.length; i++) {
                const actualText = textList[i] + '\n';
                message = message.concat(actualText);
                textLength += actualText.length;

                if (i < textList.length - 1 && textLength + (textList[i + 1] + '\n').length > 1024) {
                    constructedEmbed.addField(isFirstField ? title : '\u200B', message);

                    textLength = 0;
                    message = '';
                    isFirstField = false;
                }
            }
            if (message.length > 0) {
                constructedEmbed.addField(isFirstField ? title : '\u200B', message);
            }

            constructedEmbed.setFooter(footerText);
        } else {
            constructedEmbed.setColor('RED');

            if (page > maxPage && maxPage > 0) {
                constructedEmbed.addField(title, 'This page does not exist. (Max. **' + maxPage + '**)');
            } else {
                constructedEmbed.addField(title, 'No result found.');
            }
        }

        if (authorId) {
            channel.send('<@' + authorId + '>', {embed: constructedEmbed});
        } else {
            channel.send(constructedEmbed);
        }
    },

    this.formatDate = function(startDate, endDate) {
        var dateStr = '';
        if (endDate) {
            if (startDate.getFullYear() == endDate.getFullYear() && startDate.getMonth() == endDate.getMonth() && startDate.getDate() == endDate.getDate()) {
                dateStr = startDate.toLocaleString(this.locale, {day: '2-digit', month: 'long', year: 'numeric'}).concat('\n');
                dateStr = dateStr.concat(startDate.toLocaleString(this.locale, {hour: '2-digit', minute: '2-digit'}));
                dateStr = dateStr.concat(' - ' + endDate.toLocaleString(this.locale, {hour: '2-digit', minute: '2-digit'}));
            } else {
                dateStr = startDate.toLocaleString(this.locale, {day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'}).concat('\n');
                dateStr = dateStr.concat('**To** ' + endDate.toLocaleString(this.locale, {day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'}));
            }
        } else {
            dateStr = startDate.toLocaleString(this.locale, {day: '2-digit', month: 'long', year: 'numeric'}).concat('\n');
            dateStr = dateStr.concat(startDate.toLocaleString(this.locale, {hour: '2-digit', minute: '2-digit'}));
        }

        return dateStr;
    }

    this.sendSearchResult = function(channel, authorId, result, title, footer = null, count = result.length, page = 1) {
        var resultList = [];
        for (i = 0; i < result.length; i++) {
            const currentMeetingData = result[i].dataValues;
            const startTime = new Date(currentMeetingData.start_time * 1000);

            var message = '';
            message = message.concat('**#' + currentMeetingData.id + ' - ' + currentMeetingData.name + '** ');
            message = message.concat(currentMeetingData.location_name_short + ', ' + startTime.toLocaleDateString(this.locale) + ' ' + startTime.toLocaleTimeString(this.locale, {hour: '2-digit', minute: '2-digit'}));

            resultList.push(message);
        }

        this.sendPagedList(channel, authorId, resultList, title, footer, count, page);
    }

    this.sendInfoPanelFromData = function(authorId, channel, data, message) {
        const actualTime = new Date().getTime() / 1000;
        const constructedEmbed = new this.discord.RichEmbed();
        constructedEmbed.setColor('BLUE');
        constructedEmbed.setTitle('📅   Meeting #' + data.id + ': ' + data.name);
        constructedEmbed.setURL('http://www.google.com/maps/place/' + data.latitude + ',' + data.longitude);

        if (actualTime > data.start_time) {
            constructedEmbed.addField('Status', '**Finished**');
        }
        
        if (data.end_time) {
            var startDate = new Date(data.start_time * 1000);
            var endDate = new Date(data.end_time * 1000);
            constructedEmbed.addField('Date', this.formatDate(startDate, endDate), true);
        } else {
            var startDate = new Date(data.start_time * 1000);
            constructedEmbed.addField('Date', this.formatDate(startDate), true);
        }

        constructedEmbed.addField('Owner', '<@' + data.owner_id + '>', true)

        if (data.location_name_short) {
            constructedEmbed.addField('Location', '**' + data.location_name_short + '**\n' + data.latitude + ', ' + data.longitude, true);
        } else {
            constructedEmbed.addField('Location', data.latitude + ', ' + data.longitude, true);
        }

        this.meetingManager.countMeetingMembers(data.id)
            .then(memberCount => {
                return Promise.all([memberCount, this.meetingManager.hasUserJoinedMeeting(authorId, data.id)]);
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
                    channel.send('<@' + authorId + '> - ' + message, {embed: constructedEmbed});
                } else {
                    if (authorId) {
                        channel.send('<@' + authorId + '>', {embed: constructedEmbed});
                    } else {
                        channel.send(constructedEmbed);
                    }
                }
            });
    }

    this.sendInfoPanel = function(authorId, channel, id, message) {
        this.meetingManager.getMeetingData(id)
            .then(result => {
                if (result) {
                    this.sendInfoPanelFromData(authorId, channel, result.dataValues, message);
                } else {
                    this.sendError(channel, authorId, 'Invalid meeting id.');
                }
            }).catch(e => {
                this.sendError(channel, authorId, 'An error has occured: ' + e);
            });
    }

    this.sendMeetingMembersPanel = function(channel, authorId, meetingId, page = 0) {
        this.meetingManager.getUsersInMeeting(meetingId, this.listLimit, this.listLimit * page)
            .then(result => {
                if (result.count > 0) {
                    var textList = [];
                    for (i = 0; i < result.users.length; i++) {
                        textList.push('<@' + result.users[i] + '>');
                    }

                    this.sendPagedList(channel, authorId, textList, 'Members in Meeting #' + meetingId, null, result.count, page + 1);
                } else {
                    this.sendConfirmation(channel, authorId, 'No user has joined this Meeting.', 'Members in Meeting #' + meetingId);
                }
            }).catch(e => {
                this.sendError(channel, authorId, 'An error has occured: ' + e);
            });
    }

    this.notifyUser = function(client, userId, message, meetingId = null, data = null) {
        return new Promise((resolve, reject) => {
            client.fetchUser(userId)
                .then(result => {
                    this.sendConfirmation(result, null, message, 'Notification');
                    
                    if (meetingId) {
                        if (data) {
                            this.sendInfoPanelFromData(null, result, data);
                        } else {
                            this.sendInfoPanel(null, result, meetingId);
                        }
                    }
                }).catch(() => undefined);
        });
    }

    this.notifyUsers = function(client, userIdList, message, meetingId = null, data = null) {
        for (i = 0; i < userIdList.length; i++) {
            this.notifyUser(client, userIdList[i], message, meetingId, data);
        }
    }

    this.notifyUsersInMeeting = function(client, message, meetingId = null, data = null) {
        this.meetingManager.getUsersInMeeting(meetingId)
            .then(result => {
                this.notifyUsers(client, result.users, message, meetingId, data)
            }).catch(e => {
                console.log('Error while notifying users: ' + e);
            });
    }
}