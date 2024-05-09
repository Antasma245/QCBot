const { SlashCommandBuilder, ActivityType } = require('discord.js');
const wait = require('node:timers/promises').setTimeout;
const env = require('dotenv').config();
const botAdminId = process.env.botAdminId;
const submissionsChannelId = process.env.submissionsChannelId;

module.exports = {
	data: new SlashCommandBuilder()
		.setName('config')
		.setDescription('Customize the bot further')
		.addStringOption(option =>
            option.setName('status')
                .setDescription('Set the bot\'s status')
                .addChoices(
					{ name: 'Online', value: 'online' },
					{ name: 'Idle', value: 'idle' },
					{ name: 'Do Not Disturb', value: 'dnd' },
					{ name: 'Invisible', value: 'invisible' },
                ))
		.addStringOption(option =>
            option.setName('activity-type')
                .setDescription('Set the bot\'s activity type')
				.addChoices(
					{ name: 'Watching', value: 'watching' },
					{ name: 'Listening', value: 'listening' },
					{ name: 'Playing', value: 'playing'},
					{ name: 'Competing', value: 'competing'},
					{ name: 'Custom', value: 'custom'},
					{ name: 'Reset', value: 'reset'},
				))
		.addStringOption(option =>
            option.setName('activity-name')
                .setDescription('Set the bot\'s activity name'))
		.addStringOption(option =>
            option.setName('nickname')
                .setDescription('Set the bot\'s nickname'))
		.addAttachmentOption(option =>
            option.setName('avatar')
                .setDescription('Set the bot\'s avatar'))
        .setDMPermission(false),
	async execute(interaction) {
		await interaction.deferReply({ ephemeral: true });
		
        if (interaction.user.id != botAdminId) {
            return await interaction.editReply(`You do not have permission to use this command.`);
        }

        const newStatus = await interaction.options.getString('status');
		const newActivityType = await interaction.options.getString('activity-type');
        const newActivityName = await interaction.options.getString('activity-name');
		const newNickname = await interaction.options.getString('nickname');
        const newAvatar = await interaction.options.getAttachment('avatar');

		if (!newStatus && !newActivityType && !newActivityName && !newNickname && !newAvatar) {
            return await interaction.editReply(`Choose something to set!`);
        }

		const options = [ newStatus, newActivityType, newActivityName, newNickname, newAvatar ];
		const plannedActions = options.filter(element => element).length;
		let executedActions = 0;

		await interaction.editReply(`Waiting for all actions to be executed (${executedActions}/${plannedActions})`);
		await wait(2000);

		if (newStatus) {
			try {
				await interaction.client.user.setStatus(newStatus);
				executedActions += 1;
				await interaction.editReply(`Status successfully set.\nWaiting for all actions to be executed (${executedActions}/${plannedActions})`);
				await wait(3000);
			} catch (setStatusError) {
				await interaction.editReply(`Unable to set status. ${setStatusError}\nWaiting for all actions to be executed (${executedActions}/${plannedActions})`);
				await wait(4000);
			}
		}

		if (newActivityType) {
            try {
                if (newActivityType == 'reset') {
                    await interaction.client.user.setPresence({});
                    executedActions += 1;
                    await interaction.editReply(`Activity succesfully reset.\nWaiting for all actions to be executed (${executedActions}/${plannedActions})`);
                    await wait(3000);
                } else {
                    const submissionsChannel = await interaction.guild.channels.fetch(submissionsChannelId);

                    switch (newActivityType) {
                        case 'watching':
                            await interaction.client.user.setActivity({
                                name: newActivityName ?? `#${submissionsChannel.name}`,
                                type: ActivityType.Watching,
                            });
                            break;
                        case 'listening':
                            await interaction.client.user.setActivity({
                                name: newActivityName ?? `#${submissionsChannel.name}`,
                                type: ActivityType.Listening,
                            });
                            break;
                        case 'playing':
                            await interaction.client.user.setActivity({
                                name: newActivityName ?? `#${submissionsChannel.name}`,
                                type: ActivityType.Playing,
                            });
                            break;
                        case 'competing':
                            await interaction.client.user.setActivity({
                                name: newActivityName ?? `#${submissionsChannel.name}`,
                                type: ActivityType.Competing,
                            });
                            break;
                        case 'custom':
                            await interaction.client.user.setActivity({
                                name: newActivityName ?? `#${submissionsChannel.name}`,
                                type: ActivityType.Custom,
                            });
                            break;
                    }

                    if (newActivityName) {
                        executedActions += 2;
                        await interaction.editReply(`Activity type and name successfully set.\nWaiting for all actions to be executed (${executedActions}/${plannedActions})`);
                    } else {
                        executedActions += 1;
                        await interaction.editReply(`Activity type and name successfully set and name defaulted.\nWaiting for all actions to be executed (${executedActions}/${plannedActions})`);
                    }
                    await wait(3000);
			    }
            } catch (setActivityError) {
                await interaction.editReply(`Unable to set activity. ${setActivityError}\nWaiting for all actions to be executed (${executedActions}/${plannedActions})`);
                await wait(4000);
            }
        }

        if (!newActivityType && newActivityName) {
			await interaction.editReply(`Unable to set activity name. No activity type provided.\nWaiting for all actions to be executed (${executedActions}/${plannedActions})`);
			await wait(4000);
		}

		if (newNickname) {
            try {
                const botMember = await interaction.guild.members.fetch(interaction.client.user.id);
                if (newNickname == 'reset') {
                    await botMember.setNickname(null);
                    executedActions += 1;
                    await interaction.editReply(`Nickname successfully reset for **${interaction.guild.name}**.\nWaiting for all actions to be executed (${executedActions}/${plannedActions})`);
                } else {
                    await botMember.setNickname(newNickname);
                    executedActions += 1;
                    await interaction.editReply(`Nickname successfully set for **${interaction.guild.name}**.\nWaiting for all actions to be executed (${executedActions}/${plannedActions})`);
                }
                await wait(3000);
            } catch (setNicknameError) {
                await interaction.editReply(`Unable to set nickname for **${interaction.guild.name}**. ${setNicknameError}\nWaiting for all actions to be executed (${executedActions}/${plannedActions})`);
                await wait(4000);
            }
		}

		if (newAvatar) {
			try {
				interaction.client.user.setAvatar(newAvatar.url);
				executedActions += 1;
				await interaction.editReply(`Avatar successfully set.\nWaiting for all actions to be executed (${executedActions}/${plannedActions})`);
				await wait(3000);
			} catch (setAvatarError) {
				await interaction.editReply(`Unable to set avatar. ${setAvatarError}\nWaiting for all actions to be executed (${executedActions}/${plannedActions})`);
				await wait(4000);
			}
		}

		await interaction.editReply(`All actions executed (${executedActions}/${plannedActions})`);
	}
};