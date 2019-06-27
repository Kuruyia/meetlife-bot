module.exports = {
	name: 'choice',
    description: 'Choice manager',
    
	execute(stuff) {
        if (stuff.args[0] == 'test') {
            tst = [];
            for (i = 1; i < stuff.args.length; i++) {
                tst.push(stuff.args[i]);
            }

            const rep = stuff.choiceMan.addChoice(stuff.message.author.id, new stuff.choice('Test choice', tst, tst, function(option, data) {
                stuff.message.reply(data[option]);
            }));
            if (rep != true) {
                stuff.sendUtils.sendError(stuff.message.channel, stuff.message.author.id, rep);
            }

            console.log(tst);
        } else if (stuff.args[0] == 'list') {
            const rep = stuff.choiceMan.sendChoicesToChannel(stuff, stuff.message.channel, stuff.config.prefix, stuff.message.author.id);
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