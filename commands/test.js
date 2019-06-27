module.exports = {
	name: 'test',
    description: 'Functionnality tester',
    
	execute(stuff) {
        /*var results = chronode.parse(args.join(' '));
        
        message.channel.send(results[0].start.date().toString());*/
        //stuff.utils.sendPagedList(stuff.message.channel, stuff.args, 'Test paged list', null, 42);
        const constructedEmbed = new stuff.discord.RichEmbed();
        constructedEmbed.setColor('BLUE');
        constructedEmbed.addField('visible', 'salut');
        constructedEmbed.addField('\u200B', 'invisible');
    
        stuff.message.channel.send(constructedEmbed);
	},
};