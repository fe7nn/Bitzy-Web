/**
 * ==============================================================================
 * Bitzy Discord Bot - Slash Command Registration Script
 * ==============================================================================
 * Run this script to register or update application commands with Discord:
 *   npm run bot:deploy-commands
 */

require('dotenv').config();
const { REST, Routes, SlashCommandBuilder } = require('discord.js');

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.CLIENT_ID;
const guildId = process.env.GUILD_ID; // Optional: for instant guild-level testing

if (!token || !clientId) {
  console.error('❌ Missing DISCORD_TOKEN or CLIENT_ID in environment variables.');
  process.exit(1);
}

const commands = [
  new SlashCommandBuilder()
    .setName('verify')
    .setDescription('Verify your student membership and receive official roles')
    .addStringOption(option =>
      option
        .setName('student_id')
        .setDescription('Your official Student ID (e.g., 2024-00101)')
        .setRequired(true)
    ),
].map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
  try {
    console.log(`⏳ Started refreshing ${commands.length} application (/) commands...`);

    let data;
    if (guildId) {
      // Fast guild registration (instant for development server)
      data = await rest.put(
        Routes.applicationGuildCommands(clientId, guildId),
        { body: commands }
      );
      console.log(`✅ Successfully reloaded ${data.length} application (/) commands for Guild ID: ${guildId}.`);
    } else {
      // Global registration (available across all servers)
      data = await rest.put(
        Routes.applicationCommands(clientId),
        { body: commands }
      );
      console.log(`✅ Successfully reloaded ${data.length} global application (/) commands.`);
    }
  } catch (error) {
    console.error('❌ Error deploying application commands:', error);
  }
})();