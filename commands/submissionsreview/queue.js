const { SlashCommandBuilder } = require('discord.js');
const { SubmissionsTable } = require('../../database/database-models');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('queue')
		.setDescription('Check your submission\'s number in queue')
        .addIntegerOption(option =>
            option.setName('submission-id')
                .setDescription('Your submission ID')
                .setRequired(true)
                .setMaxValue(999)),
	async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        const inputSubmissionId = await interaction.options.getInteger('submission-id');
        
        let storedSubmissionsIdList = [];

        const storedSubmissionsIdRaw = await SubmissionsTable.findAll({ attributes: [ 'storedSubmissionId' ], order: [ [ 'createdAt', 'ASC' ] ] });
        storedSubmissionsIdList.push(...storedSubmissionsIdRaw.map((tag) => tag.storedSubmissionId));

        if (!storedSubmissionsIdList.includes(inputSubmissionId)) {
            return await interaction.editReply(`No submission found with ID: ${inputSubmissionId}. Please check if your submission ID is correct.`);
        }

        const listLength = storedSubmissionsIdList.length;

        const submissionIndex = storedSubmissionsIdList.indexOf(inputSubmissionId);

        await interaction.editReply(`Your submission (ID: ${inputSubmissionId}) is number ${submissionIndex + 1} out of ${listLength} in queue. It will be reviewed shortly.`);
    }
};