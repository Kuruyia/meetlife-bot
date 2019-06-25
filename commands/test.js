module.exports = {
	name: 'test',
    description: 'Functionnality tester',
    
	execute(stuff) {
        /*var results = chronode.parse(args.join(' '));
        
        message.channel.send(results[0].start.date().toString());*/
        console.log(stuff.args);
	},
};