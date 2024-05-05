const { Events, EmbedBuilder } = require('discord.js');
const env = require('dotenv').config();
const botAdminId = process.env.botAdminId;

module.exports = {
	name: Events.InteractionCreate,
	async execute(interaction) {
		if (!interaction.isChatInputCommand()) return;

		const command = interaction.client.commands.get(interaction.commandName);

		if (!command) {
			console.error(`[ERROR] No command matching ${interaction.commandName} was found.`);
			return;
		}

		try {
			await command.execute(interaction);
		} catch (interactionError) {
			console.error(`[ERROR] New error report! Occured on ${new Date().toUTCString()} while executing '/${interaction.commandName}'`);
			console.log(interactionError);

			try {
				const botAdmin = await interaction.client.users.fetch(botAdminId);
				await botAdmin.send({
					embeds: [ new EmbedBuilder()
						.setColor(`6ba4b8`)
						.setTitle(`New error report!`)
						.setDescription(`Occured on ${new Date().toUTCString()} while executing '/${interaction.commandName}'\n\`\`\`\n${interactionError}\n\`\`\``)
						.setFooter({ text: `Full message is available in console` }) ],
					flags: [ 4096 ] // Silent message flag
				});

				console.log(`[INFO] A copy of the previous message has been sent to ${botAdmin.displayName}`);
			} catch (dmError) {
				console.warn(`[WARNING] Failed to send a copy of the previous message to the bot administrator`);
				console.log(dmError);
			}
		}
	}
};