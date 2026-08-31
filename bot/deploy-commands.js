/**
 * ==============================================================================
 * Bitzy Discord Bot - Slash Command Registration Script
 * ==============================================================================
 * Run this script to manually register or update application commands:
 *   npm run bot:deploy-commands
 *
 * (Note: bot/bot.js also auto-syncs these commands on startup).
 * ==============================================================================
 */

require('dotenv').config();
const { REST, Routes, SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.CLIENT_ID;
const guildId = process.env.GUILD_ID;

if (!token || !clientId) {
  console.error('❌ Missing DISCORD_TOKEN or CLIENT_ID in environment variables.');
  process.exit(1);
}

const commands = [
  // 1. /verify [student_id]
  new SlashCommandBuilder()
    .setName('verify')
    .setDescription('Verify your student membership and receive official roles')
    .addStringOption(option =>
      option
        .setName('student_id')
        .setDescription('Your official Student ID (e.g., 12-3456-789)')
        .setRequired(true)
    ),

  // 2. /clear [amount]
  new SlashCommandBuilder()
    .setName('clear')
    .setDescription('Bulk delete recent messages in this channel (Range: 1 to 100)')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addIntegerOption(option =>
      option
        .setName('amount')
        .setDescription('Number of messages to delete (1-100)')
        .setMinValue(1)
        .setMaxValue(100)
        .setRequired(true)
    ),

  // 3. /post-verify-guide
  new SlashCommandBuilder()
    .setName('post-verify-guide')
    .setDescription('Post the official ICpEP.SE CIT - U Chapter verification welcome guide banner')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addBooleanOption(option =>
      option
        .setName('mention_unverified')
        .setDescription('Mention the @Unverified role at the bottom (Default: true)')
        .setRequired(false)
    ),
].map(cmd => cmd.toJSON());

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
  try {
    console.log(`⏳ Deploying ${commands.length} application (/) commands to Discord...`);

    if (guildId) {
      const data = await rest.put(
        Routes.applicationGuildCommands(clientId, guildId),
        { body: commands }
      );
      console.log(`⚡ Instantly deployed ${data.length} commands to Target Guild (${guildId}).`);
    }

    const globalData = await rest.put(
      Routes.applicationCommands(clientId),
      { body: commands }
    );
    console.log(`✅ Successfully deployed ${globalData.length} commands globally across all servers.`);
  } catch (error) {
    console.error('❌ Error deploying application commands:', error);
  }
})();