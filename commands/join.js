module.exports = {
	name: 'join',
    description: 'Join a Meeting',
    
	execute(stuff) {
        if (stuff.args.length >= 1) {
            const meetingId = parseInt(stuff.args[0]);
            if (!isNaN(meetingId)) {
                var notifDelay = 1;
                var minuteMode = false;
                if (stuff.args.length >= 2) {
                    if (stuff.args[1].endsWith('m') || stuff.args[1].endsWith('h')) {
                        minuteMode = stuff.args[1].endsWith('m');
                        stuff.args[1] = stuff.args[1].substr(0, stuff.args[1].length - 1);
                    }
        
                    var parsedTime = parseFloat(stuff.args[1]);
                    if (isNaN(parsedTime) || (notifDelay = minuteMode ? parsedTime / 60 : parsedTime) < 0 || notifDelay > 168) {
                        stuff.sendUtils.sendError(stuff.message.channel, stuff.message.author.id, 'The second argument must be an hour between **0** and **168**,\nor a minute between **0** and **10 080** suffixed with the letter "m".');
                        return;
                    }
                }

                stuff.meetingMan.isMeetingOver(meetingId)
                    .then(over => {
                        if (!over) {
                            return stuff.meetingMan.joinUserToMeeting(stuff.message.author.id, meetingId, notifDelay);
                        } else {
                            throw "You can't join a finished Meeting.";
                        }
                    }).then(function() {
                        var confirmMessage = 'You have joined Meeting **#' + meetingId + '**\n';
                        if (notifDelay < 1) {
                            const minutes = parseInt(notifDelay * 60);
                            confirmMessage = confirmMessage.concat('You will be reminded ' + minutes + (minutes > 1 ? ' minutes ' : ' minute ') + 'before the Meeting begins.');
                        } else {
                            const hour = parseInt(notifDelay);
                            confirmMessage = confirmMessage.concat('You will be reminded ' + hour + 'h' + parseInt(notifDelay * 60 - (hour * 60)).toString().padStart(2, '0') + ' before the Meeting begins.');
                        }

                        stuff.sendUtils.sendConfirmation(stuff.message.channel, stuff.message.author.id, confirmMessage);
                    })
                    .catch(function(error) {
                        stuff.sendUtils.sendError(stuff.message.channel, stuff.message.author.id, error);
                    });
            } else {
                stuff.sendUtils.sendError(stuff.message.channel, stuff.message.author.id, 'Invalid meeting id.');
            }
        } else {
            stuff.sendUtils.sendUsage(stuff.message.channel, stuff.message.author.id, this.name, '[meeting id]');
        }
	},
};