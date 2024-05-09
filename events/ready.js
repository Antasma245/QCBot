const { Events } = require('discord.js');
const { SubmissionsTable, ControllerStatsTable } = require('../database-models');

module.exports = {
	name: Events.ClientReady,
	once: true,
	execute(client) {
		SubmissionsTable.sync();
		ControllerStatsTable.sync();
		console.log(`[INFO] Bot ready! Logged in as ${client.user.tag}`);
	}
};