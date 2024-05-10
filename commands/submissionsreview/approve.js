const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { SubmissionsTable } = require('../../database/database-models');
const { incrementControllerCount } = require('../../database/incrementControllerCount');
const env = require('dotenv').config();
const controllerRoleId = process.env.controllerRoleId;
const grantedRoleId = process.env.grantedRoleId;
const grantedChannelId = process.env.grantedChannelId;
const logsChannelId = process.env.logsChannelId;

module.exports = {
	data: new SlashCommandBuilder()
		.setName('approve')
		.setDescription('Approve a submission')
        .addIntegerOption(option =>
            option.setName('submission-id')
                .setDescription('The submission ID')
                .setRequired(true)
                .setMaxValue(999))
        .addStringOption(option =>
            option.setName('comment')
                .setDescription('Anything to add?')
                .setMaxLength(500)),
    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        if (!interaction.member.roles.cache.has(controllerRoleId)) {
            return await interaction.editReply(`You do not have permission to approve submissions.`);
        }
        
        const inputSubmissionId = await interaction.options.getInteger('submission-id');
        const comment = await interaction.options.getString('comment');
        
        const submissionTag = await SubmissionsTable.findOne({ where: { storedSubmissionId: inputSubmissionId } });

        if (!submissionTag) {
            return await interaction.editReply(`No submission found with ID: ${inputSubmissionId}. Please check if your submission ID is correct.`);
        }

        const applicantId = submissionTag.get('storedApplicantId');
        const submissionLink = submissionTag.get('storedSubmissionLink');

        const controllerName = interaction.member.nickname ?? interaction.member.displayName;

        const applicant = await interaction.guild.members.fetch(applicantId);
        const grantedRole = await interaction.guild.roles.fetch(grantedRoleId);

        let primaryActionCompleted = false;

        try {
            await applicant.roles.add(grantedRole);

            await SubmissionsTable.destroy({ where: { storedSubmissionId: inputSubmissionId } });

            primaryActionCompleted = true;

            const splitSubmissionLink = submissionLink.split('/');
            const submissionMessageId = splitSubmissionLink[splitSubmissionLink.length - 1];

            const submissionMessage = await interaction.channel.messages.fetch(submissionMessageId);

            await submissionMessage.reply(`<@${applicantId}> Your submission (ID: ${inputSubmissionId}) has been approved by **${controllerName}**.\nComment: *${comment}*\nYou've been granted the **${grantedRole.name}** role and can now post in the https://discord.com/channels/${interaction.guild.id}/${grantedChannelId} channel.`);

            await interaction.editReply(`Submission successfully approved.\nYou may now dismiss this message.`);
		} catch (error) {
            await interaction.editReply(`An error occurred. Please try again.`);
            throw error;
		}

        if (primaryActionCompleted == true) {
            await incrementControllerCount(interaction);

            if (logsChannelId) {
                const logsChannel = await interaction.guild.channels.fetch(logsChannelId);
                await logsChannel.send({ embeds: [ new EmbedBuilder()
                    .setColor(`Green`)
                    .setTitle('New voice model approved')
                    .setDescription(`**ID:** ${inputSubmissionId}\n**Submitted by:** <@${applicantId}>\n**Link:** ${submissionLink}\n\n**Approved by:** <@${interaction.user.id}>\n**Comment:** *${comment}*`) ] });
            }
        }
    } 
};