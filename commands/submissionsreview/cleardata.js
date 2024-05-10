const { ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder } = require('discord.js');
const { SubmissionsTable, ControllerStatsTable } = require('../../database/database-models');
const env = require('dotenv').config();
const botAdminId = process.env.botAdminId;

module.exports = {
	data: new SlashCommandBuilder()
		.setName('cleardata')
		.setDescription('Clear a table')
        .addStringOption(option =>
            option.setName('table')
                .setDescription('Choose which table to clear')
                .addChoices(
					{ name: 'Submissions', value: 'choiceSubmissions' },
					{ name: 'Controller stats', value: 'choiceControllerStats' },
                )
                .setRequired(true)),
	async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        if (interaction.user.id != botAdminId) {
            return await interaction.editReply(`You do not have permission to use this command.`);
        }

        const selectedTable = await interaction.options.getString('table');

        let selectedTableName;

        switch (selectedTable) {
            case 'choiceSubmissions':
                selectedTableName = 'submissions table';
                break;
            case 'choiceControllerStats':
                selectedTableName = 'controller stats';
                break;
        }
        
        const confirmButton = new ButtonBuilder()
			.setCustomId('confirm')
			.setLabel('Confirm')
			.setStyle(ButtonStyle.Danger);

		const cancelButton = new ButtonBuilder()
			.setCustomId('cancel')
			.setLabel('Cancel')
			.setStyle(ButtonStyle.Secondary);

		const sentMessage = await interaction.editReply({
			content: `Confirm ${selectedTableName} wipe-off? This action cannot be undone.`,
			components:  [new ActionRowBuilder().addComponents(cancelButton, confirmButton) ],
        });

        try {
            const confirmation = await sentMessage.awaitMessageComponent({ time: 30_000 });

            if (confirmation.customId == 'confirm') {
                switch (selectedTable) {
                    case 'choiceSubmissions':
                        await SubmissionsTable.destroy({ where: {}, truncate: true });
                        await confirmation.update({ content: `Successfully removed all submissions from the table.`, components: [] });
                        break;
                    case 'choiceControllerStats':
                        await ControllerStatsTable.destroy({ where: {}, truncate: true });
                        await confirmation.update({ content: `Successfully removed all controller stats from the table.`, components: [] });
                        break;
                }
            } else if (confirmation.customId == 'cancel') {
                await confirmation.update({ content: `Action cancelled.`, components: [] });
            }
        } catch (error) {
            if (error.name == 'Error [InteractionCollectorError]') {
                await interaction.editReply({ content: `Confirmation not received within 30 seconds, cancelling operation.`, components: [] });
            } else {
                await interaction.editReply(`Failed to delete table content! ${error}`);
            }
        }
    }
};