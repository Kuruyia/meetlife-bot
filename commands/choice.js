module.exports = {
	name: 'choice',
    description: 'Choice management',
    url: 'https://github.com/Arc13/meetlife-bot/wiki/1.2-"Choice"-command',
    
	execute(stuff) {
        if (stuff.args.length > 0) {
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
        } else {
            stuff.sendUtils.sendUsage(stuff.message.channel, stuff.message.author.id, this.name, '[list/cancel/choose]');
        }
    },
    
    getHelp(args) {
        if (args.length == 0) {
            const argsList = [
                {name: 'list/cancel/choose', description: 'Subcommands for this command'}
            ];

            return {command: this.name, args: argsList};
        } else {
            if (args[0] == 'choose') {
                const argsList = [
                    {name: '1..x', description: 'Index of the chosen selection, where x is the max index'}
                ];
    
                return {command: this.name, args: argsList};
            }
        }
    },
};