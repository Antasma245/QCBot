const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('ping')
		.setDescription('Check the bot\'s ping'),
	async execute(interaction) {
        const sentMessage = await interaction.reply({
            embeds: [ new EmbedBuilder()
                .setColor(`6ba4b8`)
                .setTitle(`Pinging... 📨`) ],
            fetchReply: true
        });

        await interaction.editReply({
            embeds: [ new EmbedBuilder()
                .setColor(`6ba4b8`)
                .setTitle(`Pong! 📬`)
                .setDescription(`Websocket heartbeat: ${interaction.client.ws.ping}ms\nRoundtrip latency: ${sentMessage.createdTimestamp - interaction.createdTimestamp}ms`) ]
        });
	}
};