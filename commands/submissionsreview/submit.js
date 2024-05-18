const { SlashCommandBuilder } = require('discord.js');
const { SubmissionsTable } = require('../../database/database-models');
const env = require('dotenv').config();
const submissionsChannelId = process.env.submissionsChannelId;
const grantedRoleId = process.env.grantedRoleId;
const grantedChannelId = process.env.grantedChannelId;

module.exports = {
	data: new SlashCommandBuilder()
		.setName('submit')
		.setDescription('Submit your model for validation to get a special role')
        .addStringOption(option =>
            option.setName('model-name')
                .setDescription('The name of your model')
                .setRequired(true)
                .setMaxLength(100))
        .addStringOption(option =>
            option.setName('technology')
                .setDescription('The technology used for training')
                .setRequired(true)
                .addChoices(
                    { name: 'RVC', value: 'RVC' },
                    { name: 'GPT-SoVITS', value: 'GPT-SoVITS' },
                ))
        .addStringOption(option =>
            option.setName('extraction')
                .setDescription('The extraction method used for training')
                .setRequired(true)
                .addChoices(
                    { name: 'pm', value: 'pm' },
                    { name: 'harvest', value: 'harvest' },
                    { name: 'dio', value: 'dio' },
                    { name: 'crepe', value: 'crepe' },
                    { name: 'mangio-crepe', value: 'mangio-crepe' },
                    { name: 'rmvpe', value: 'rmvpe' },
                ))
        .addIntegerOption(option =>
            option.setName('epochs')
                .setDescription('The number of epochs of your model')
                .setRequired(true)
                .setMaxValue(100000))
        .addStringOption(option =>
            option.setName('link')
                .setDescription('The link of your model (Huggingface only!)')
                .setRequired(true)
                .setMaxLength(150))
        .addAttachmentOption(option =>
            option.setName('image')
                .setDescription('An image for your model')
                .setRequired(true))
        .addAttachmentOption(option =>
            option.setName('demo')
                .setDescription('An audio file containing a demo of your model (no instrumental!)')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('note')
                .setDescription('Anything else?')
                .setMaxLength(500))
        .setDMPermission(false),
	async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        if (await interaction.member.roles.cache.has(grantedRoleId)) {
            return await interaction.editReply(`You already have the desired role. You can post your models in the https://discord.com/channels/${interaction.guild.id}/${grantedChannelId} channel.`);
        }

        const applicantId = interaction.user.id;
        const modelName = await interaction.options.getString('model-name');
		const technology = await interaction.options.getString('technology');
        const extraction = await interaction.options.getString('extraction');
		const epochs = await interaction.options.getInteger('epochs');
		const modelLink = await interaction.options.getString('link');
        const image = await interaction.options.getAttachment('image');
        const demo = await interaction.options.getAttachment('demo');
        const note = await interaction.options.getString('note') ?? 'N/A';

        // Checks if the applicant already has a submission in queue
        const rowFromApplicantId = await SubmissionsTable.findOne({ where: { storedApplicantId: applicantId } });

        if (rowFromApplicantId) {
            const submissionIdFromApplicantId = rowFromApplicantId.get('storedSubmissionId');
            const submissionLinkFromApplicantId = rowFromApplicantId.get('storedSubmissionLink');
            return await interaction.editReply(`There's already a submission from you in queue:\n**ID:** ${submissionIdFromApplicantId}\n**Link:** ${submissionLinkFromApplicantId}\nPlease note that you only need to submit one model. If you want to, you can check your submission's number in queue using \`/queue\` or cancel it using \`/cancel\`.`);
        }

        // Checks if the link is of the form 'https://huggingface.co/XXXX/XXXX/resolve/main/XXXX.zip'
        const linkPattern = /https:\/\/huggingface\.co\/\w+\/\w+\/resolve\/main\/\w+\.zip(\?.*)?/;
        const matchedLink = modelLink.match(linkPattern);

        if (!matchedLink) {
            return await interaction.editReply(`Invalid link. Please note that all models are required to have a "resolve" Huggingface link. Additionally, your model files must be placed in a \`.zip\` archive (no \`.rar\`, \`.7z\`, ...).\nPlease follow this tutorial to make sure you get the correct Huggingface link: <https://docs.aihub.wtf/essentials/voice-models/#uploading-to-hugging-face>.`);
        }


        // Checks if the model has been trained using an outdated extraction method
        if (extraction == 'pm' || extraction == 'harvest' || extraction == 'dio') {
            return await interaction.editReply(`Sorry, outdated extraction methods such as *${extraction}* are no longer accepted.\nYou may retrain the model with a more recent one (e.g. *rmvpe* or *crepe*) and reapply.`);
        }

        // Checks if the image/demo are of an accepted type
        const imageType = image.contentType.toLowerCase();
        const demoType = demo.contentType.toLowerCase();

        if (!imageType.includes('png') && !imageType.includes('jpeg') && !imageType.includes('gif') && !imageType.includes('webp')) {
            return await interaction.editReply(`Invalid file type for "image". Please attach a file with a supported extension.\nSupported file types: \`.png\`, \`.jpg\`, \`.jpeg\`, \`.gif\`, \`.webp\`.`);
        } else if (!demoType.includes('wav') && !demoType.includes('flac') && !demoType.includes('mpeg') && !demoType.includes('mp4') && !demoType.includes('ogg')) {
            return await interaction.editReply(`Invalid file type for "demo". Please attach a file with a supported extension.\nSupported file types: \`.wav\`, \`.flac\`, \`.mp3\`, \`.m4a\`, \`.ogg\`.`);
        }

        // Checks if the image/demo size is smaller than 25MB
        const imageSize = image.size;
        const demoSize = demo.size;

        if (imageSize>=25_000_000) {
            return await interaction.editReply(`Invalid file size for "image". Please attach a file that is under 25MB.`);
        } else if (demoSize>=25_000_000) {
            return await interaction.editReply(`Invalid file size for "demo". Please attach a file that is under 25MB.`);
        }

        await interaction.editReply(`Your submission is being processed... Please wait...`);

        // Generates a random submission ID and ensures it is not already assigned
        function getRandomInt(min, max) {
            return Math.floor(Math.random() * (max - min + 1)) + min;
        }

        let submissionId = getRandomInt(1, 999);
        let generatedIdChecked = false;
        let storedSubmissionsIdList = [];

        const storedSubmissionsIdRaw = await SubmissionsTable.findAll({ attributes: [ 'storedSubmissionId' ] });
        storedSubmissionsIdList.push(...storedSubmissionsIdRaw.map((tag) => tag.storedSubmissionId));

        while (generatedIdChecked == false) {
            if (storedSubmissionsIdList.includes(submissionId)) {
                submissionId = getRandomInt(1, 999);
            } else {
                generatedIdChecked = true;
            }
        }

        try {
            const submissionsChannel = await interaction.guild.channels.fetch(submissionsChannelId);
            const submissionMessage = await submissionsChannel.send({
                content: `## New model submission\n**Name:** ${modelName}\n**Technology:** ${technology}\n**Extraction type:** ${extraction}\n**Number of epochs:** ${epochs}\n**Link:** <${modelLink}>\n**Note:** ${note}\n**Submission ID:** ${submissionId}\n\nSubmitted by <@${applicantId}> using the </${interaction.commandName}:${interaction.commandId}> command`,
                files: [ image, demo ] });

            const submissionLink = `https://discord.com/channels/${interaction.guild.id}/${interaction.channel.id}/${submissionMessage.id}`;

            await SubmissionsTable.create({
				storedSubmissionId: submissionId,
				storedApplicantId: applicantId,
				storedSubmissionLink: submissionLink,
			});

            await interaction.editReply(`Your model has been successfully submitted:\n**ID:** ${submissionId}\n**Link:** ${submissionLink}\nYou will be notified once it has been reviewed. You may now dismiss this message.`);
		} catch (error) {
			await interaction.editReply(`An error occurred. Please try again.`);
            throw error;
		}
	}
};