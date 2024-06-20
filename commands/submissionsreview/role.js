const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const env = require('dotenv').config();
const controllerRoleId = process.env.controllerRoleId;
const grantedRoleId = process.env.grantedRoleId;
const blacklistRoleId = process.env.blacklistRoleId;
const logsChannelId = process.env.logsChannelId;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('role')
        .setDescription('Manage special roles')
        .addStringOption(option =>
            option.setName('action')
                .setDescription('Give or remove the role')
                .setRequired(true)
                .addChoices(
                    { name: 'Give', value: 'give' },
                    { name: 'Remove', value: 'remove' },
                ))
        .addRoleOption(option =>
            option.setName('role')
                .setDescription('The role to give/remove')
                .setRequired(true))
        .addUserOption(option =>
            option.setName('target-user')
                .setDescription('The target user')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Why did you give/remove the role')
                .setRequired(true)
                .setMaxLength(500)),
    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        if (!interaction.member.roles.cache.has(controllerRoleId)) {
            return await interaction.editReply(`You do not have permission to use this command.`);
        }

        const action = await interaction.options.getString('action');
        const selectedRole = await interaction.options.getRole('role');
        const targetUser = await interaction.options.getUser('target-user');
        const reason = await interaction.options.getString('reason');

        if (selectedRole.id != grantedRoleId && selectedRole.id != blacklistRoleId) {
            return await interaction.editReply(`This command can only be used to give/remove the <@&${grantedRoleId}> and the <@&${blacklistRoleId}> roles.`);
        }

        const targetMember = await interaction.guild.members.fetch(targetUser.id);

        let primaryActionCompleted = false;

        try {
            switch (action) {
                case 'give':
                    if (targetMember.roles.cache.has(selectedRole.id)) {
                        return await interaction.editReply(`<@${targetMember.id}> already has the ${selectedRole.name} role.`);
                    }

                    await targetMember.roles.add(selectedRole);

                    primaryActionCompleted = true;

                    await interaction.editReply(`${selectedRole.name} role successfully added to <@${targetMember.id}>`);

                    break;
                case 'remove':
                    if (!targetMember.roles.cache.has(selectedRole.id)) {
                        return await interaction.editReply(`<@${targetMember.id}> doesn't have the ${selectedRole.name} role.`);
                    }

                    await targetMember.roles.remove(selectedRole);

                    primaryActionCompleted = true;

                    await interaction.editReply(`${selectedRole.name} role successfully removed from <@${targetMember.id}>`);

                    break;
            }
        } catch (error) {
            await interaction.editReply(`An error occurred. Please try again.`);
            throw error;
        }

        if (primaryActionCompleted == true && logsChannelId) {
            const logsChannel = await interaction.guild.channels.fetch(logsChannelId);

            switch (action) {
                case 'give':
                    await logsChannel.send({
                        embeds: [ new EmbedBuilder()
                            .setColor(`6ba4b8`)
                            .setTitle('Manual role update')
                            .setDescription(`<@${interaction.user.id}> has manually given the ${selectedRole.name} role to <@${targetMember.id}>.\n\n**Reason:** ${reason}`) ]
                    });
                    break;
                case 'remove':
                    await logsChannel.send({
                        embeds: [ new EmbedBuilder()
                            .setColor(`6ba4b8`)
                            .setTitle('Manual role update')
                            .setDescription(`<@${interaction.user.id}> has manually removed the ${selectedRole.name} role from <@${targetMember.id}>.\n\n**Reason:** ${reason}`) ]
                    });
                    break;
            }
        }
    }
};