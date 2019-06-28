const Sequelize = require('sequelize');

const seqOp = Sequelize.Op;
const sequelize = new Sequelize('database', 'username', 'password', {
	host: 'localhost',
	dialect: 'sqlite',
	logging: false,
	storage: 'storage.db'
});

const UpcomingMeetings = sequelize.import('models/UpcomingMeetings');
const JoinedMeetings = sequelize.import('models/JoinedMeetings');

JoinedMeetings.belongsTo(UpcomingMeetings, {
	foreignKey: {
		name: 'upcoming_meeting_id',
		allowNull: false,
		unique: 'uniqueJoin'
	},
	onDelete: 'CASCADE'
});

sequelize.sync();

module.exports = {sequelize, seqOp, UpcomingMeetings, JoinedMeetings};
