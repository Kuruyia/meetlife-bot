module.exports = {
	name: 'test',
    description: 'Functionnality tester',
    
	execute(stuff) {
        /*var results = chronode.parse(args.join(' '));
        
        message.channel.send(results[0].start.date().toString());*/
        //stuff.sendUtils.sendPagedList(stuff.message.channel, stuff.args, 'Test paged list', null, 42);
        stuff.meetingMan.notifyUsersInMeeting(stuff, stuff.client, stuff.args[0], 'test');
	},
};