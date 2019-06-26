module.exports = (sequelize, DataTypes) => {
	return sequelize.define('joined_meetings', {
		user_id: {
			type: DataTypes.INTEGER,
			allowNull: false,
		},
	}, {
		timestamps: false,
	});
};