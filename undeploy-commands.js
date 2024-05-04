const { REST, Routes } = require('discord.js');
const env = require('dotenv').config();
const botToken = process.env.botToken;
const botClientId = process.env.botClientId;

const rest = new REST().setToken(botToken);

rest.put(Routes.applicationCommands(botClientId), { body: [] })
	.then(() => console.log(`[INFO] Successfully removed all application (/) commands.`))
	.catch(console.error);