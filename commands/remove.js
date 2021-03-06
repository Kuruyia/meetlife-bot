module.exports = {
	name: 'remove',
    description: 'Delete one of your Meeting',
    url: 'https://github.com/Arc13/meetlife-bot/wiki/1.13-"Remove"-command',
    
	execute(stuff) {
        if (stuff.args.length >= 1) {
            const meetingId = parseInt(stuff.args[0]);

            if (!stuff.message.guild || !stuff.message.guild.available) {
                stuff.sendUtils.sendError(stuff.dbObjects.UpcomingMeetings, stuff.message.author.id, stuff.message.channel, 'Guild is not available for this operation.')
                return;
            }
            const guildId = stuff.message.guild.id;

            if (!isNaN(meetingId)) {
                stuff.dbObjects.UpcomingMeetings.findOne({
                    where: {
                        id: meetingId,
                        guild_id: guildId
                    }
                }).then(result => {
                    if (result) {
                        const data = result.dataValues;
                        const ownerId = data.owner_id;

                        if (ownerId == stuff.message.author.id || stuff.message.member.hasPermission(stuff.discord.Permissions.FLAGS.MANAGE_MESSAGES)) {
                            stuff.meetingMan.getMeetingData(meetingId, guildId)
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
                                        
                                        stuff.sendUtils.sendConfirmation(stuff.message.channel, stuff.message.author.id, 'This Meeting has been removed.', 'Meeting #' + meetingId, ownerOverriden ? 'Moderator mode - Owner verification has been bypassed' : null);
                                        stuff.sendUtils.notifyUsers(stuff.client, joinedUsers.users, 'A Meeting you have joined has been removed.', meetingId, guildId, meetingData.dataValues);
                                    } else {
                                        stuff.sendUtils.sendError(stuff.message.channel, stuff.message.author.id, 'This Meeting could not be deleted.');
                                    }
                                });
                        } else {
                            stuff.sendUtils.sendError(stuff.message.channel, stuff.message.author.id, 'You can\'t delete this Meeting because you don\'t own it.');
                        }
                    } else {
                        stuff.sendUtils.sendError(stuff.message.channel, stuff.message.author.id, 'Invalid Meeting ID.');
                    }
                });
            } else {
                stuff.sendUtils.sendError(stuff.message.channel, stuff.message.author.id, 'Invalid Meeting ID.');
            }
        } else {
            stuff.sendUtils.sendUsage(stuff.message.channel, stuff.message.author.id, this.name, '[meeting id]');
        }
    },
    
    getHelp(args) {
        if (args.length == 0) {
            const argsList = [
                {name: 'id', description: 'ID of a Meeting you own, to be deleted'}
            ];

            return {command: this.name, args: argsList};
        }
    },
};