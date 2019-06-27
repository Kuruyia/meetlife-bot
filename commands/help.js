module.exports = {
	name: 'help',
    description: 'Provides help about this bot',
    
	execute(stuff) {
        if (stuff.args.length >= 1 && (stuff.args.length > 1 || isNaN(parseInt(stuff.args[0])))) {
            const commandName = stuff.args.shift();
            if (!stuff.client.commands.has(commandName)) {
                stuff.sendUtils.sendError(stuff.message.channel, stuff.message.author.id, 'The command **' + commandName + '** could not be found.');
                return;
            }

            const command = stuff.client.commands.get(commandName);
            if (command.getHelp) {
                const result = command.getHelp(stuff.args);
                if (result) {
                    stuff.sendUtils.sendHelpPanel(stuff.message.channel, stuff.message.author.id, result.command, result.args, command.url);
                } else {
                    stuff.sendUtils.sendError(stuff.message.channel, stuff.message.author.id, 'No help panel has been found for the given arguments.');
                    return;
                }
            } else {
                stuff.sendUtils.sendHelpPanel(stuff.message.channel, stuff.message.author.id, commandName, [], command.url);
            }
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
    
    getHelp(args) {
        if (args.length == 0) {
            const argsList = [
                {name: 'page: number/command: string', description: 'page - Page number on the command list\ncommand - Command to get help for'},
                {name: '...', description: 'Arguments to give to the command help', optional: true}
            ];

            return {command: this.name, args: argsList};
        }
    },
};