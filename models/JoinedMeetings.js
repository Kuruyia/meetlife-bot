module.exports = (sequelize, DataTypes) => {
	return sequelize.define('joined_meetings', {
		user_id: {
			type: DataTypes.STRING,
			allowNull: false,
			unique: 'uniqueJoin'
		},
		notified: {
			type: DataTypes.BOOLEAN,
			defaultValue: false
		},
		notify_delay: {
			type: DataTypes.REAL,
			defaultValue: 1
		}
	}, {
		timestamps: false,
	});
};