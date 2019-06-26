module.exports = {
	name: 'list',
    description: 'Meeting list',
    
	execute(stuff) {
        if (!stuff.args[0] || stuff.args[0] == 'asc' || stuff.args[0] == 'desc') {
            stuff.dbObjects.UpcomingMeetings.findAll({
                limit: 10,
                order: [[stuff.dbObjects.sequelize.col('start_time'), stuff.args[0] == 'desc' ? 'DESC' : 'ASC']]
            }).then(upcomingMeetings => {
                stuff.meetingMan.sendSearchResult(stuff, upcomingMeetings, 'Upcoming meeting list', stuff.args[0] == 'desc' ? 'Sorted from descending order' : 'Sorted from ascending order');
            });
        } else {
            stuff.sendUsage(stuff.message.channel, this.name, '_(asc/desc)_');
        }
	},
};