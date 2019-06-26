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
                            stuff.dbObjects.UpcomingMeetings.destroy({
                                where: {
                                    id: meetingId
                                }
                            }).then(destroyedCount => {
                                if (destroyedCount > 0) {
                                    const constructedEmbed = new stuff.discord.RichEmbed();
                                    constructedEmbed.setColor('BLUE');
                                    constructedEmbed.addField('Meeting #' + meetingId, 'This meeting has been deleted');

                                    if (ownerId != stuff.message.author.id && stuff.message.member.hasPermission(stuff.discord.Permissions.FLAGS.MANAGE_MESSAGES)) {
                                        constructedEmbed.setFooter('Moderator mode - Owner verification has been bypassed');
                                    }

                                    stuff.message.channel.send(constructedEmbed);
                                } else {
                                    stuff.sendError(stuff.message.channel, 'This meeting could not be deleted.');
                                }
                            });
                        } else {
                            stuff.sendError(stuff.message.channel, 'You can\'t delete this meeting because you don\'t own it.');
                        }
                    } else {
                        stuff.sendError(stuff.message.channel, 'Invalid meeting id.');
                    }
                });
            } else {
                stuff.sendError(stuff.message.channel, 'Invalid meeting id.');
            }
        } else {
            stuff.sendUsage(stuff.message.channel, this.name, '[meeting id]');
        }
	},
};