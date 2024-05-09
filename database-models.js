const Sequelize = require('sequelize');

const sequelize = new Sequelize('database', 'user', 'password', {
	dialect: 'sqlite',
	logging: false,
	storage: 'database.sqlite',
});

const SubmissionsTable = sequelize.define('SubmissionsTable', {
	storedSubmissionId: {
		type: Sequelize.INTEGER,
		primaryKey: true,
		unique: true,
	},
	storedApplicantId: Sequelize.STRING,
	storedSubmissionLink: Sequelize.STRING,
});

const ControllerStatsTable = sequelize.define('ControllerStatsTable', {
	storedControllerId: {
		type: Sequelize.STRING,
		primaryKey: true,
		unique: true,
	},
	storedControllerCount: {
		type: Sequelize.INTEGER,
		defaultValue: 0,
		allowNull: false,
	},
    storedControllerName: Sequelize.STRING,
});

module.exports = {
    SubmissionsTable,
    ControllerStatsTable,
};