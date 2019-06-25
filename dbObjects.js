const Sequelize = require('sequelize');

const sequelize = new Sequelize('database', 'username', 'password', {
	host: 'localhost',
	dialect: 'sqlite',
	logging: false,
	storage: 'storage.db',
});

const UpcomingMeetings = sequelize.import('models/UpcomingMeetings');

sequelize.sync();

module.exports = {sequelize, UpcomingMeetings};
