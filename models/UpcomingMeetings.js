module.exports = (sequelize, DataTypes) => {
	return sequelize.define('upcoming_meeting', {
		name: DataTypes.STRING,
		time: {
			type: DataTypes.DATE,
			allowNull: false,
		},
	}, {
		timestamps: false,
	});
};