const { SlashCommandBuilder } = require('discord.js');
const wait = require('node:timers/promises').setTimeout;
const env = require('dotenv').config();
const botAdminId = process.env.botAdminId;

module.exports = {
	data: new SlashCommandBuilder()
		.setName('say')
		.setDescription('Make the bot say something')
        .addStringOption(option =>
            option.setName('text')
                .setDescription('Enter text')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('target-id')
                .setDescription('A target message ID to reply'))
        .addBooleanOption(option =>
            option.setName('ping-reply')
                .setDescription('Whether to ping the target author'))
        .addBooleanOption(option =>
            option.setName('add-reaction')
                .setDescription('Whether to react to the target'))
        .addBooleanOption(option =>
            option.setName('edit')
                .setDescription('Whether to edit the target'))
        .setDMPermission(false),
    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        if (interaction.user.id != botAdminId) {
            return await interaction.editReply(`You do not have permission to use this command.`);
        }

        const text = await interaction.options.getString('text');
        const targetMessageId = await interaction.options.getString('target-id');
        const pingOnReply = await interaction.options.getBoolean('ping-reply') ?? true;
        const addReaction = await interaction.options.getBoolean('add-reaction') ?? false;
        const editMessage = await interaction.options.getBoolean('edit') ?? false;

        function lenghtOfMatches(text, regexPattern) {
            const matches = text.match(regexPattern);
            let totalMatchesLength = 0;

            if (matches) {
                const matchesString = matches.join('');
                totalMatchesLength = matchesString.length;
            }

            return totalMatchesLength;
        }

        const emojiPattern = /<:[^<>]+:[^<>]+>/g;
        const totalEmojiLength = lenghtOfMatches(text, emojiPattern);

        const linkPattern = /\bhttps:\/\/\S+/g;
        const totalLinkLength = lenghtOfMatches(text, linkPattern);

        const typingTime = (text.length * 150) - (totalEmojiLength * 150) - (totalLinkLength * 150);

        try {
            if (!targetMessageId) {
                await interaction.channel.sendTyping();
                await wait(typingTime);

                await interaction.channel.send(text);

                await interaction.editReply(`Message sent!`);
            } else if (!addReaction && !editMessage) {
                const targetMessage = await interaction.channel.messages.fetch(targetMessageId);
            
                await interaction.channel.sendTyping();
                await wait(typingTime);
            
                await targetMessage.reply({ content: text, allowedMentions: { repliedUser: pingOnReply } });
            
                await interaction.editReply(`Message sent!`);
            } else if (addReaction) {
                const targetMessage = await interaction.channel.messages.fetch(targetMessageId);
            
                await targetMessage.react(text);
            
                await interaction.editReply(`Reaction added!`);
            } else {
                const targetMessage = await interaction.channel.messages.fetch(targetMessageId);

                await targetMessage.edit(text);

                await interaction.editReply(`Message edited!`);
            }
        } catch (error) {
            await interaction.editReply(`Failed to execute! ${error}`);
        }
    }
};