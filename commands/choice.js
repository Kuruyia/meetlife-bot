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
                stuff.utils.sendError(stuff.message.channel, rep);
            }

            console.log(tst);
        } else if (stuff.args[0] == 'list') {
            const rep = stuff.choiceMan.sendChoicesToChannel(stuff, stuff.message.channel, stuff.config.prefix, stuff.message.author.id);
            if (rep != true) {
                stuff.utils.sendError(stuff.message.channel, rep);
            }
        } else if (stuff.args[0] == 'cancel') {
            const rep = stuff.choiceMan.cancel(stuff.message.author.id);
            if (rep != true) {
                stuff.utils.sendError(stuff.message.channel, rep);
            } else {
                const constructedEmbed = new stuff.discord.RichEmbed();
                constructedEmbed.setColor('BLUE');
                constructedEmbed.addField('Active choice', 'Your active choice has been canceled.');

                stuff.message.channel.send(constructedEmbed);
            }
        } else if (stuff.args[0] == 'choose') {
            const rep = stuff.choiceMan.choose(stuff.message.author.id, stuff.args[1]);
            if (rep != true) {
                stuff.utils.sendError(stuff.message.channel, rep);
            }
        }
	},
};