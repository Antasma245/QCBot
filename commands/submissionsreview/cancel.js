const { SlashCommandBuilder } = require('discord.js');
const { SubmissionsTable } = require('../../database/database-models');
const { incrementControllerCount } = require('../../database/incrementControllerCount');
const env = require('dotenv').config();
const controllerRoleId = process.env.controllerRoleId;

module.exports = {
	data: new SlashCommandBuilder()
		.setName('cancel')
		.setDescription('Cancel your submission')
        .addIntegerOption(option =>
            option.setName('submission-id')
                .setDescription('Your submission ID')
                .setRequired(true)
                .setMaxValue(999)),
	async execute(interaction) {
        await interaction.deferReply();
        
        const inputSubmissionId = interaction.options.getInteger('submission-id');
        const interactionUserId = interaction.user.id;
        
        const submissionTag = await SubmissionsTable.findOne({ where: { storedSubmissionId: inputSubmissionId } });

        if (!submissionTag) {
            return await interaction.editReply(`No submission found with ID: ${inputSubmissionId}. Please check if your submission ID is correct.`);
        }

        const storedApplicantId = submissionTag.get('storedApplicantId');
    
        if (interactionUserId != storedApplicantId && !interaction.member.roles.cache.has(controllerRoleId)) {
            return await interaction.editReply(`You do not have permission to cancel this submission.`);
        }

        let primaryActionCompleted = false;

        try {
            await SubmissionsTable.destroy({ where: { storedSubmissionId: inputSubmissionId } });

            primaryActionCompleted = true;

            await interaction.editReply(`<@${interaction.user.id}> Your submission (ID: ${inputSubmissionId}) has been successfully removed from queue.`);
		} catch (error) {
            await interaction.editReply(`An error occurred. Please try again.`);
			throw error;
		}

        if (primaryActionCompleted == true && interaction.member.roles.cache.has(controllerRoleId)) {
            await incrementControllerCount(interaction);
        }
    }
};