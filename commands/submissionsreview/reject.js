const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { SubmissionsTable } = require('../../database/database-models');
const { incrementControllerCount } = require('../../database/incrementControllerCount');
const wait = require('node:timers/promises').setTimeout;
const env = require('dotenv').config();
const controllerRoleId = process.env.controllerRoleId;
const logsChannelId = process.env.logsChannelId;

module.exports = {
	data: new SlashCommandBuilder()
		.setName('reject')
		.setDescription('Reject a submission')
        .addIntegerOption(option =>
            option.setName('submission-id')
                .setDescription('The submission ID')
                .setRequired(true)
                .setMaxValue(999))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Why did you reject the submission?')
                .setRequired(true)
                .setMaxLength(500))
        .addBooleanOption(option =>
            option.setName('delete-message')
                .setDescription('Whether to delete the submission message')),
    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        if (!interaction.member.roles.cache.has(controllerRoleId)) {
            return await interaction.editReply(`You do not have permission to reject submissions.`);
        }
        
        const inputSubmissionId = await interaction.options.getInteger('submission-id');
        const reason = await interaction.options.getString('reason');
        const deleteSubmissionMessage = await interaction.options.getBoolean('delete-message') ?? false;
        
        const submissionTag = await SubmissionsTable.findOne({ where: { storedSubmissionId: inputSubmissionId } });

        if (!submissionTag) {
            return await interaction.editReply(`No submission found with ID: ${inputSubmissionId}. Please check if your submission ID is correct.`);
        }

        const applicantId = submissionTag.get('storedApplicantId');
        const submissionLink = submissionTag.get('storedSubmissionLink');

        const controllerName = interaction.member.nickname ?? interaction.member.displayName;

        let primaryActionCompleted = false;

        try {
            await SubmissionsTable.destroy({ where: { storedSubmissionId: inputSubmissionId } });

            primaryActionCompleted = true;

            const splitSubmissionLink = submissionLink.split('/');
            const submissionMessageId = splitSubmissionLink[splitSubmissionLink.length - 1];

            const submissionMessage = await interaction.channel.messages.fetch(submissionMessageId);

            await submissionMessage.reply(`<@${applicantId}> Your submission (ID: ${inputSubmissionId}) has been rejected by **${controllerName}**.\nReason: *${reason}*\nPlease apply these changes and try again.`);

            if (deleteSubmissionMessage == true) {
                await wait(5000);
                await submissionMessage.delete();
            }

            await interaction.editReply(`Submission successfully rejected.\nYou may now dismiss this message.`);
		} catch (error) {
            await interaction.editReply(`An error occurred. Please try again.`);
            throw error;
		}

        if (primaryActionCompleted == true) {
            await incrementControllerCount(interaction);

            if (logsChannelId) {
                const logsChannel = await interaction.guild.channels.fetch(logsChannelId);
                await logsChannel.send({ embeds: [ new EmbedBuilder()
                    .setColor(`Red`)
                    .setTitle('New voice model rejected')
                    .setDescription(`**ID:** ${inputSubmissionId}\n**Submitted by:** <@${applicantId}>\n**Link:** ${submissionLink}\n\n**Rejected by:** <@${interaction.user.id}>\n**Reason:** *${reason}*`) ] });
            }
        }
    } 
};