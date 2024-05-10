const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { ControllerStatsTable } = require('../../database/database-models');
const env = require('dotenv').config();
const botAdminId = process.env.botAdminId;

module.exports = {
	data: new SlashCommandBuilder()
		.setName('activity')
		.setDescription('Check the controller\'s activity'),
	async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        if (interaction.user.id != botAdminId && !interaction.member.permissions.has(PermissionFlagsBits.BanMembers)) {
            return await interaction.editReply(`You do not have permission to use this command.`);
        }

        const controllerDataRaw = await ControllerStatsTable.findAll({ attributes: [ 'storedControllerId', 'storedControllerCount', 'storedControllerName' ], order: [ [ 'storedControllerCount', 'DESC' ] ] });
        const controllerList = controllerDataRaw.map(tag => `**${tag.storedControllerName}** (${tag.storedControllerId}): **${tag.storedControllerCount}**`).join('\n') || 'Table is empty.';

        const saveButton = new ButtonBuilder()
            .setCustomId('save')
            .setLabel('Save stats')
            .setEmoji('💾')
            .setStyle(ButtonStyle.Secondary);

        const sentMessage = await interaction.editReply({
            embeds: [ new EmbedBuilder().setColor(`6ba4b8`).setTitle(`Current controller stats`).setDescription(`${controllerList}`) ],
            components: [ new ActionRowBuilder().addComponents(saveButton) ],
        });

        try {
            const confirmation = await sentMessage.awaitMessageComponent({ time: 30_000 });

            if (confirmation.customId == 'save') {
                await interaction.user.send({
                    embeds: [ new EmbedBuilder()
                        .setColor(`6ba4b8`)
                        .setTitle(`Current controller stats`)
                        .setDescription(`${controllerList}`)
                        .setFooter({ text: `Requested by ${interaction.user.displayName}` })
                        .setTimestamp() ]
                });
                
                await confirmation.update({
                    embeds: [ new EmbedBuilder()
                        .setColor(`Green`)
                        .setTitle(`Current controller stats`)
                        .setDescription(`${controllerList}`)
                        .setFooter({ text: `Current controller stats successfully sent to ${interaction.user.displayName}` }) ],
                    components: [],
                });
            }
        } catch (error) {
            if (error.name == 'Error [InteractionCollectorError]') {      
                const saveButtonExpired = new ButtonBuilder()
                    .setCustomId('expired')
                    .setLabel('Expired')
                    .setEmoji('💾')
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(true);

                await interaction.editReply({
                    embeds: [ new EmbedBuilder().setColor(`6ba4b8`).setTitle(`Current controller stats`).setDescription(`${controllerList}`) ],
                    components: [ new ActionRowBuilder().addComponents(saveButtonExpired) ],
                });
            } else if (error.code == 50007) {
                await confirmation.update({
                    embeds: [ new EmbedBuilder()
                        .setColor(`Yellow`)
                        .setTitle(`Current controller stats`)
                        .setDescription(`${controllerList}`)
                        .setFooter({ text: `Bot is unable to DM ${interaction.user.displayName}. Please check if your DMs are open.` }) ],
                    components: [],
                });
            } else {
                await confirmation.update({
                    embeds: [ new EmbedBuilder()
                        .setColor(`Yellow`)
                        .setTitle(`Current controller stats`)
                        .setDescription(`${controllerList}`)
                        .setFooter({ text: `An unexpected error has occured. Could not save controller stats.` }) ],
                    components: [],
                });

                throw error;
            }
        }
    }
};