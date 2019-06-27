module.exports = {
	name: 'remove',
    description: 'Meeting remove',
    
	execute(stuff) {
        if (stuff.args.length >= 1) {
            const meetingId = parseInt(stuff.args[0]);
            if (!isNaN(meetingId)) {
                stuff.dbObjects.UpcomingMeetings.findOne({
                    where: {
                        id: meetingId
                    }
                }).then(result => {
                    if (result) {
                        const data = result.dataValues;
                        const ownerId = data.owner_id;

                        if (ownerId == stuff.message.author.id || stuff.message.member.hasPermission(stuff.discord.Permissions.FLAGS.MANAGE_MESSAGES)) {
                            stuff.meetingMan.getMeetingData(meetingId)
                                .then(result => {
                                    return Promise.all([result, stuff.meetingMan.getUsersInMeeting(meetingId)]);
                                }).then(result => {
                                    var promiseList = result;
                                    promiseList.push(stuff.dbObjects.UpcomingMeetings.destroy({
                                        where: {
                                            id: meetingId
                                        }
                                    }));

                                    return Promise.all(promiseList);
                                }).then(result => {
                                    const meetingData = result.shift();
                                    const joinedUsers = result.shift();
                                    const destroyedCount = result.shift();

                                    if (destroyedCount > 0) {
                                        const ownerOverriden = ownerId != stuff.message.author.id && stuff.message.member.hasPermission(stuff.discord.Permissions.FLAGS.MANAGE_MESSAGES);
                                        
                                        stuff.sendUtils.sendConfirmation(stuff.message.channel, 'This Meeting has been removed.', 'Meeting #' + meetingId, ownerOverriden ? 'Moderator mode - Owner verification has been bypassed' : null);
                                        stuff.sendUtils.notifyUsers(stuff.message.author.id, stuff.client, meetingId, joinedUsers.users, 'A Meeting you have joined has been removed.', meetingData.dataValues);
                                    } else {
                                        stuff.sendUtils.sendError(stuff.message.channel, 'This Meeting could not be deleted.');
                                    }
                                });
                        } else {
                            stuff.sendUtils.sendError(stuff.message.channel, 'You can\'t delete this Meeting because you don\'t own it.');
                        }
                    } else {
                        stuff.sendUtils.sendError(stuff.message.channel, 'Invalid meeting id.');
                    }
                });
            } else {
                stuff.sendUtils.sendError(stuff.message.channel, 'Invalid meeting id.');
            }
        } else {
            stuff.sendUtils.sendUsage(stuff.message.channel, this.name, '[meeting id]');
        }
	},
};