module.exports = {
	name: 'ping',
	description: 'Ping!',
	execute(stuff) {
        /*var results = chronode.parse(args.join(' '));
        
        message.channel.send(results[0].start.date().toString());*/
        message.reply(stuff.args.toString());
	},
};