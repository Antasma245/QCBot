const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { SubmissionsTable } = require('../../database/database-models');
const env = require('dotenv').config();
const controllerRoleId = process.env.controllerRoleId;

module.exports = {
	data: new SlashCommandBuilder()
		.setName('checkplus')
		.setDescription('Get a list of all submissions in queue'),
	async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });
        
        if (!interaction.member.roles.cache.has(controllerRoleId)) {
            return await interaction.editReply({ content: `You do not have permission to review submissions.`, ephemeral: true });
        }

        const storedSubmissionsRaw = await SubmissionsTable.findAll({ attributes: [ 'storedSubmissionId', 'storedSubmissionLink' ], order: [ [ 'createdAt', 'ASC' ] ] });
        const storedSubmissionsList = storedSubmissionsRaw.map(tag => `**${tag.storedSubmissionId}**: ${tag.storedSubmissionLink}`).join('\n') || 'No new submissions to check. Queue is empty.\nGood job :saluting_face:';

        await interaction.editReply({ embeds: [ new EmbedBuilder().setColor(`6ba4b8`).setTitle(`Current submissions in queue`).setDescription(`${storedSubmissionsList}`) ], ephemeral: true });
    }
};