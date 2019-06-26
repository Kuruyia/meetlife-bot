module.exports = (sequelize, DataTypes) => {
	return sequelize.define('joined_meetings', {
		meeting_id: {
			type: DataTypes.INTEGER,
			allowNull: false,
		},
		user_id: {
			type: DataTypes.INTEGER,
			allowNull: false,
		},
	}, {
		timestamps: false,
	});
};