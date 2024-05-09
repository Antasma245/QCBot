const { SlashCommandBuilder } = require('discord.js');
const axios = require('axios');
const nasaApiKey = process.env.nasaApiKey;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('apod')
        .setDescription('Get the astronomy picture of the day'),
    async execute(interaction) {
        let ephemeralReply;

        if (interaction.inGuild()) {
            ephemeralReply = true;
        } else {
            ephemeralReply = false;
        }

        await interaction.deferReply({ ephemeral: ephemeralReply });

        try {
            const response = await axios.get(`https://api.nasa.gov/planetary/apod?thumbs=true&api_key=${nasaApiKey}`);
            const apod = response.data;
      
            await interaction.editReply({ content: `## ${apod.title}\n${apod.explanation}\n\n**Link:** <${apod.url}>`, files: [ apod.thumbnail_url ?? apod.url ] });
        } catch (error) {
            await interaction.editReply(`An error occurred. Please try again.`);
            throw error;
        }
    }
};