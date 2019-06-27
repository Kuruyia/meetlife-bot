module.exports = (sequelize, DataTypes) => {
	return sequelize.define('joined_meetings', {
		user_id: {
			type: DataTypes.STRING,
			allowNull: false,
			unique: 'uniqueJoin'
		},
	}, {
		timestamps: false,
	});
};