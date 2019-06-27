module.exports = {
	name: 'help',
    description: 'Helping a lot',
    
	execute(stuff) {
        if (stuff.args.length >= 1 && (stuff.args.length > 1 || isNaN(parseInt(stuff.args[0])))) {

        } else {
            var commandList = [];
            var page = 0;

            if (stuff.args.length >= 1) {
                const parsedPage = parseInt(stuff.args[0]);

                if (!isNaN(parsedPage) && parsedPage > 0) {
                    page = parsedPage - 1;
                } else {
                    stuff.sendUtils.sendError(stuff.message.channel, stuff.message.author.id, 'Invalid page: **' + stuff.args[0] + '**');
                    return;
                }
            }

            const splitCommands = Array.from(stuff.client.commands.keys()).slice(stuff.config.search_limit * page, stuff.config.search_limit * (page + 1));
            for (i = 0; i < splitCommands.length; i++) {
                const currentCommand = stuff.client.commands.get(splitCommands[i]);
                commandList.push('**' + splitCommands[i] + '**\n' + currentCommand.description);
            }

            stuff.sendUtils.sendPagedList(stuff.message.channel, stuff.message.author.id, commandList, 'Command list', 'Type "' + stuff.config.prefix + 'help [command]" to get specific help.', stuff.client.commands.size, page + 1);
        }
	},
};