module.exports = (sequelize, DataTypes) => {
	return sequelize.define('upcoming_meetings', {
		name: DataTypes.STRING,
		start_time: {
			type: DataTypes.INTEGER,
			allowNull: false,
		},
		end_time: DataTypes.INTEGER,
		longitude: {
			type: DataTypes.REAL,
			allowNull: false,
		},
		latitude: {
			type: DataTypes.REAL,
			allowNull: false,
		},
		owner_id: {
			type: DataTypes.INTEGER,
			allowNull: false,
		},
		join_limit: DataTypes.INTEGER,
	}, {
		timestamps: false,
	});
};