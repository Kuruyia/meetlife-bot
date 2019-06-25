module.exports = (sequelize, DataTypes) => {
	return sequelize.define('upcoming_meeting', {
		name: DataTypes.STRING,
		start_time: {
			type: DataTypes.DATE,
			allowNull: false,
		},
		end_time: DataTypes.DATE,
		longitude: DataTypes.REAL,
		latitude: DataTypes.REAL,
	}, {
		timestamps: false,
	});
};