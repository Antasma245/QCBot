const { SlashCommandBuilder } = require('discord.js');
const { SubmissionsTable } = require('../../database/database-models');
const env = require('dotenv').config();
const controllerRoleId = process.env.controllerRoleId;

module.exports = {
	data: new SlashCommandBuilder()
		.setName('check')
		.setDescription('Review a submission'),
	async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });
        
        if (!interaction.member.roles.cache.has(controllerRoleId)) {
            return await interaction.editReply({ content:`You do not have permission to review submissions.`, ephemeral: true });
        }
        
        let storedSubmissionsIdList = [];

        const storedSubmissionsIdRaw = await SubmissionsTable.findAll({ attributes: [ 'storedSubmissionId' ], order: [ [ 'createdAt', 'ASC' ] ] });
        storedSubmissionsIdList.push(...storedSubmissionsIdRaw.map((tag) => tag.storedSubmissionId));

        const listLength = storedSubmissionsIdList.length;
        
        if (listLength == 0) {
            return await interaction.editReply({ content: `No new submissions to check. Queue is empty.\nGood job :saluting_face:`, ephemeral: true });
        }

        const submissionTag = await SubmissionsTable.findOne({ where: { storedSubmissionId: storedSubmissionsIdList[0] } });
        const storedSubmissionLink = submissionTag.get('storedSubmissionLink');

        if (listLength == 1) {
            await interaction.editReply({ content: `1 submission is awaiting to be reviewed:\n**ID:** ${storedSubmissionsIdList[0]}\n**Link:** ${storedSubmissionLink}`, ephemeral: true });
        } else {
            await interaction.editReply({ content: `${listLength} submissions are awaiting to be reviewed. Here's the least recent one:\n**ID:** ${storedSubmissionsIdList[0]}\n**Link:** ${storedSubmissionLink}`, ephemeral: true });
        }
    }
};