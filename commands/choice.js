module.exports = {
	name: 'choice',
    description: 'Choice management',
    
	execute(stuff) {
        if (stuff.args[0] == 'list') {
            const rep = stuff.choiceMan.sendChoicesToChannel(stuff, stuff.message.author.id, stuff.message.channel, stuff.config.prefix, stuff.message.author.id);
            if (rep != true) {
                stuff.sendUtils.sendError(stuff.message.channel, stuff.message.author.id, rep);
            }
        } else if (stuff.args[0] == 'cancel') {
            const rep = stuff.choiceMan.cancel(stuff.message.author.id);
            if (rep != true) {
                stuff.sendUtils.sendError(stuff.message.channel, stuff.message.author.id, rep);
            } else {
                stuff.sendUtils.sendConfirmation(stuff.message.channel, stuff.message.author.id, 'Your active choice has been canceled.');
            }
        } else if (stuff.args[0] == 'choose') {
            const rep = stuff.choiceMan.choose(stuff.message.author.id, stuff.args[1]);
            if (rep != true) {
                stuff.sendUtils.sendError(stuff.message.channel, stuff.message.author.id, rep);
            }
        }
	},
};