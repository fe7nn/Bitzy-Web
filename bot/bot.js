/**
 * ==============================================================================
 * Bitzy Discord Bot - Unified Monorepo Service
 * ==============================================================================
 * Features:
 *  - Supabase Database Integration (Zero Google Sheets dependencies)
 *  - Auto Slash Command Registration on Startup (Zero manual setup needed)
 *  - Slash Commands:
 *      1. /verify <student_id> (Private, ephemeral student verification)
 *      2. /clear <amount> (Bulk delete 1-100 messages for moderation)
 *      3. /post-verify-guide (Posts the official ICpEP.SE CIT - U verification guide)
 *  - Resilient #verify Channel Message Listener (with anti-spam & auto-deletion)
 *  - Member Welcome & Unverified Role Assignment
 *  - Auto Role Assignment & Safe Nickname Syncing
 *  - Express Uptime & Health Check Gateway (For Render / UptimeRobot)
 * ==============================================================================
 */

require('dotenv').config();
const {
  Client,
  GatewayIntentBits,
  Partials,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActivityType,
  REST,
  Routes,
  SlashCommandBuilder,
  PermissionFlagsBits,
} = require('discord.js');
const { createClient } = require('@supabase/supabase-js');
const express = require('express');

// ------------------------------------------------------------------------------
// 1. Supabase Client Initialization
// ------------------------------------------------------------------------------
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ [Bitzy Bot] Missing Supabase credentials in environment variables!');
  console.error('   Please provide NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
});

// ------------------------------------------------------------------------------
// 2. Discord Client Initialization
// ------------------------------------------------------------------------------
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
  ],
  partials: [Partials.Channel, Partials.GuildMember, Partials.User, Partials.Message, Partials.Reaction],
});

// Anti-spam cooldown map: userId -> lastTimestamp (ms)
const userCooldown = new Map();
const COOLDOWN_MS = 5000;

// ------------------------------------------------------------------------------
// Slash Command Definitions
// ------------------------------------------------------------------------------
const slashCommands = [
  // 1. /verify [student_id]
  new SlashCommandBuilder()
    .setName('verify')
    .setDescription('Verify your student membership and receive official roles')
    .addStringOption(option =>
      option
        .setName('student_id')
        .setDescription('Your official Student ID (e.g., 2024-00101)')
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
    .setDescription('Post the official ICpEP.SE CIT - U Chapter verification welcome guide')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addBooleanOption(option =>
      option
        .setName('mention_unverified')
        .setDescription('Mention the @Unverified role at the bottom (Default: true)')
        .setRequired(false)
    ),
];

// ------------------------------------------------------------------------------
// Helper: Format Student Names
// ------------------------------------------------------------------------------
function formatStudentDisplayName(student) {
  const mInitial =
    student.middle_name && student.middle_name.trim().length > 0
      ? ` ${student.middle_name.trim().charAt(0).toUpperCase()}.`
      : '';
  return `${student.first_name}${mInitial} ${student.last_name}`;
}

function formatFormalName(student) {
  const mInitial =
    student.middle_name && student.middle_name.trim().length > 0
      ? ` ${student.middle_name.trim().charAt(0).toUpperCase()}.`
      : '';
  return `${student.last_name}, ${student.first_name}${mInitial}`;
}

// ------------------------------------------------------------------------------
// Core Verification Service Logic (Shared by Slash Command & Message Listener)
// ------------------------------------------------------------------------------
async function processStudentVerification({ studentIdInput, discordUser, guild, member }) {
  const normalizedInput = studentIdInput.replace(/\u00A0/g, ' ').trim();

  if (!normalizedInput || normalizedInput.length < 3) {
    return {
      success: false,
      code: 'INVALID_INPUT',
      title: 'Invalid Student ID',
      message: 'Please provide a valid official Student ID.',
    };
  }

  // 1. Check if this Discord account is already linked to a different student
  const { data: existingDiscord, error: discordCheckError } = await supabase
    .from('students')
    .select('*')
    .eq('discord_id', discordUser.id)
    .maybeSingle();

  if (discordCheckError) {
    console.error('Supabase discord_id lookup error:', discordCheckError.message);
  }

  if (existingDiscord && existingDiscord.student_id.toLowerCase() !== normalizedInput.toLowerCase()) {
    return {
      success: false,
      code: 'DISCORD_ALREADY_LINKED',
      title: 'Account Already Linked',
      message: `Your Discord account is already linked to Student ID **${existingDiscord.student_id}** (${formatFormalName(
        existingDiscord
      )}).\n\n*If you believe this is an error, please contact a server administrator.*`,
    };
  }

  // 2. Query Supabase for student record by ID (case-insensitive)
  const { data: student, error: studentLookupError } = await supabase
    .from('students')
    .select('*')
    .ilike('student_id', normalizedInput)
    .maybeSingle();

  if (studentLookupError) {
    console.error('Supabase student_id query error:', studentLookupError.message);
    return {
      success: false,
      code: 'DATABASE_ERROR',
      title: 'System Error',
      message: 'Could not connect to the verification database. Please try again in a few moments.',
    };
  }

  if (!student) {
    return {
      success: false,
      code: 'NOT_FOUND',
      title: 'Student ID Not Found',
      message: `Student ID \`${normalizedInput}\` was not found in the official Masterlist.\n\nPlease verify your ID number or check with your organization officer.`,
    };
  }

  // 3. Check if student is already verified with a different Discord account
  if (student.is_verified && student.discord_id && student.discord_id !== discordUser.id) {
    return {
      success: false,
      code: 'ALREADY_VERIFIED',
      title: 'Already Verified by Another Account',
      message: `Student ID **${student.student_id}** is already linked to another Discord user.\n\nPlease ask an administrator to unlink the previous account if you changed Discord accounts.`,
    };
  }

  // 4. Update the student record in Supabase
  const verifiedAt = new Date().toISOString();
  const discordTag = discordUser.tag || discordUser.username;

  const { error: updateError } = await supabase
    .from('students')
    .update({
      is_verified: true,
      discord_id: discordUser.id,
      discord_tag: discordTag,
      verified_at: verifiedAt,
    })
    .eq('student_id', student.student_id);

  if (updateError) {
    console.error('Supabase student update error:', updateError.message);
    return {
      success: false,
      code: 'UPDATE_FAILED',
      title: 'Update Error',
      message: 'Failed to record verification status. Please notify an administrator.',
    };
  }

  // 5. Assign Server Roles & Manage Role Hierarchy
  const assignedRoleNames = [];
  if (guild && member) {
    try {
      const primaryRoleCandidates = ['ka-CpE', 'ICpEP.SE Verified Member', 'Verified Member', 'Verified'];
      for (const candidate of primaryRoleCandidates) {
        const role = guild.roles.cache.find(r => r.name.toLowerCase() === candidate.toLowerCase());
        if (role) {
          await member.roles.add(role).catch(err => {
            console.warn(`[Role Assignment Warn] Could not assign ${role.name}: ${err.message}`);
          });
          assignedRoleNames.push(role.name);
          break;
        }
      }

      // Course-specific roles
      const course = (student.course || '').toUpperCase();
      let courseRoleCandidate = '';
      if (course.includes('CPE') || course.includes('COMPUTER ENGINEERING')) {
        courseRoleCandidate = 'Computer Engineering';
      } else if (course.includes('CS') || course.includes('COMPUTER SCIENCE')) {
        courseRoleCandidate = 'Computer Science';
      } else if (course.includes('IT') || course.includes('INFORMATION TECHNOLOGY')) {
        courseRoleCandidate = 'Information Technology';
      }

      if (courseRoleCandidate) {
        const courseRole = guild.roles.cache.find(r =>
          r.name.toLowerCase().includes(courseRoleCandidate.toLowerCase())
        );
        if (courseRole && !member.roles.cache.has(courseRole.id)) {
          await member.roles.add(courseRole).catch(() => {});
          assignedRoleNames.push(courseRole.name);
        }
      }

      // Remove Unverified role
      const unverifiedRole = guild.roles.cache.find(r => r.name.toLowerCase() === 'unverified');
      if (unverifiedRole && member.roles.cache.has(unverifiedRole.id)) {
        await member.roles.remove(unverifiedRole).catch(err => {
          console.warn(`[Role Removal Warn] Could not remove Unverified role: ${err.message}`);
        });
      }

      // 6. Safe Nickname Update
      const desiredNickname = formatStudentDisplayName(student);
      if (desiredNickname && desiredNickname.length <= 32) {
        await member.setNickname(desiredNickname).catch(err => {
          console.log(`[Nickname Sync] Skipped nickname for ${discordUser.username} (${err.message})`);
        });
      }
    } catch (roleErr) {
      console.error('[Role & Nickname Handler Error]:', roleErr);
    }
  }

  const fullName = formatStudentDisplayName(student);

  return {
    success: true,
    student: {
      student_id: student.student_id,
      full_name: fullName,
      course: student.course || 'BSCpE',
      year_level: student.year_level || '1st Year',
    },
    rolesAssigned: assignedRoleNames,
    message: `Verification complete! Welcome to the community, **${fullName}**!`,
  };
}

// ------------------------------------------------------------------------------
// 3. Event: Bot Ready (Auto-Syncs Slash Commands)
// ------------------------------------------------------------------------------
client.once('ready', async () => {
  console.log(`=======================================================`);
  console.log(`🤖 Bitzy Discord Bot is ONLINE as ${client.user.tag}`);
  console.log(`🌐 Serving ${client.guilds.cache.size} server(s)`);
  console.log(`📊 Connected to Supabase: ${supabaseUrl}`);
  console.log(`=======================================================`);

  client.user.setPresence({
    activities: [{ name: 'for student IDs in #verify', type: ActivityType.Watching }],
    status: 'online',
  });

  // Auto-Register / Deploy Slash Commands to Discord API
  try {
    const token = process.env.DISCORD_TOKEN;
    if (token) {
      const rest = new REST({ version: '10' }).setToken(token);
      const commandData = slashCommands.map(c => c.toJSON());

      // Global Registration
      await rest.put(Routes.applicationCommands(client.user.id), { body: commandData });
      console.log(`✅ [Slash Commands] Registered ${commandData.length} commands globally.`);

      // Immediate Guild Registration for instant visibility (no caching lag)
      for (const guild of client.guilds.cache.values()) {
        await rest.put(Routes.applicationGuildCommands(client.user.id, guild.id), { body: commandData })
          .then(() => console.log(`⚡ [Slash Commands] Synced instantly to guild: ${guild.name} (${guild.id})`))
          .catch(err => console.warn(`Could not sync to guild ${guild.id}: ${err.message}`));
      }
    }
  } catch (cmdErr) {
    console.error('❌ [Slash Commands] Failed to auto-register commands:', cmdErr.message);
  }
});

// Also register commands when joining a new server
client.on('guildCreate', async guild => {
  try {
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
    const commandData = slashCommands.map(c => c.toJSON());
    await rest.put(Routes.applicationGuildCommands(client.user.id, guild.id), { body: commandData });
    console.log(`⚡ [Slash Commands] Registered commands to newly joined guild: ${guild.name}`);
  } catch (err) {
    console.warn(`Could not register commands to new guild ${guild.id}: ${err.message}`);
  }
});

// ------------------------------------------------------------------------------
// 4. Event: Guild Member Add (Auto-welcome & Unverified Role)
// ------------------------------------------------------------------------------
client.on('guildMemberAdd', async member => {
  try {
    const unverifiedRole = member.guild.roles.cache.find(r => r.name.toLowerCase() === 'unverified');
    if (unverifiedRole) {
      await member.roles.add(unverifiedRole).catch(err => {
        console.warn(`[Auto-Role] Could not assign Unverified role: ${err.message}`);
      });
    }

    const verifyChannel = member.guild.channels.cache.find(
      ch => ch.name.toLowerCase() === 'verify' && ch.isTextBased()
    );

    if (verifyChannel) {
      const welcomeEmbed = new EmbedBuilder()
        .setColor(0x3b82f6)
        .setTitle(`👋 Welcome to ${member.guild.name}, ${member.user.username}!`)
        .setDescription(
          `To gain full access to the community channels, please verify your student membership.\n\n` +
            `**Two ways to verify:**\n` +
            `1️⃣ **Type your Student ID** directly in this channel (e.g. \`2024-00101\`).\n` +
            `2️⃣ Use the slash command **/verify** anywhere.\n\n` +
            `*Your message will be automatically deleted for your privacy.*`
        )
        .setFooter({ text: 'Bitzy Verification Gateway • ICpEP.SE' })
        .setTimestamp();

      await verifyChannel.send({ content: `${member}`, embeds: [welcomeEmbed] });
    }
  } catch (err) {
    console.error('Error handling guildMemberAdd event:', err);
  }
});

// ------------------------------------------------------------------------------
// 5. Event: Message Create (Resilient Channel Listener for #verify)
// ------------------------------------------------------------------------------
client.on('messageCreate', async message => {
  if (message.author.bot || !message.guild) return;
  if (message.channel.name.toLowerCase() !== 'verify') return;

  const now = Date.now();
  const lastAttempt = userCooldown.get(message.author.id) || 0;

  if (now - lastAttempt < COOLDOWN_MS) {
    await message.delete().catch(() => {});
    return;
  }
  userCooldown.set(message.author.id, now);

  const studentIdInput = message.content.trim();

  try {
    const result = await processStudentVerification({
      studentIdInput,
      discordUser: message.author,
      guild: message.guild,
      member: message.member,
    });

    if (!result.success) {
      const errorEmbed = new EmbedBuilder()
        .setColor(0xf43f5e)
        .setTitle(`❌ ${result.title}`)
        .setDescription(result.message)
        .setFooter({ text: 'Auto-deleting in 6 seconds for privacy...' });

      const replyMsg = await message.reply({ embeds: [errorEmbed] });

      setTimeout(() => {
        replyMsg.delete().catch(() => {});
        message.delete().catch(() => {});
      }, 6000);
      return;
    }

    const successEmbed = new EmbedBuilder()
      .setColor(0x10b981)
      .setTitle('✅ Verification Successful!')
      .setDescription(`Welcome, **${result.student.full_name}**!`)
      .addFields(
        { name: 'Student ID', value: `\`${result.student.student_id}\``, inline: true },
        { name: 'Program & Year', value: `${result.student.course} - ${result.student.year_level}`, inline: true },
        {
          name: 'Roles Assigned',
          value: result.rolesAssigned.length > 0 ? result.rolesAssigned.join(', ') : 'Verified Member',
          inline: false,
        }
      )
      .setFooter({ text: 'Auto-deleting message in 6 seconds for privacy...' })
      .setTimestamp();

    const replyMsg = await message.reply({ embeds: [successEmbed] });

    setTimeout(() => {
      replyMsg.delete().catch(() => {});
      message.delete().catch(() => {});
    }, 6000);
  } catch (err) {
    console.error('Error during messageCreate verification:', err);
    const failMsg = await message.reply('⚠️ Verification system encountered an error. Please try again later.');
    setTimeout(() => {
      failMsg.delete().catch(() => {});
      message.delete().catch(() => {});
    }, 6000);
  }
});

// ------------------------------------------------------------------------------
// 6. Event: Interaction Create (Slash Commands & Interactive Modals)
// ------------------------------------------------------------------------------
client.on('interactionCreate', async interaction => {
  // --- A. Handle Button Interactions (from Verify Guide) ---
  if (interaction.isButton()) {
    if (interaction.customId === 'btn_open_verify_modal') {
      const modal = new ModalBuilder()
        .setCustomId('modal_verify_student')
        .setTitle('ICpEP.SE Student Verification');

      const studentIdInput = new TextInputBuilder()
        .setCustomId('input_student_id')
        .setLabel('Official Student ID Number')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('e.g. 2024-00101')
        .setRequired(true)
        .setMinLength(4)
        .setMaxLength(30);

      const actionRow = new ActionRowBuilder().addComponents(studentIdInput);
      modal.addComponents(actionRow);

      return interaction.showModal(modal);
    }
  }

  // --- B. Handle Modal Submissions ---
  if (interaction.isModalSubmit()) {
    if (interaction.customId === 'modal_verify_student') {
      await interaction.deferReply({ ephemeral: true });

      const studentIdInput = interaction.fields.getTextInputValue('input_student_id');

      const result = await processStudentVerification({
        studentIdInput,
        discordUser: interaction.user,
        guild: interaction.guild,
        member: interaction.member,
      });

      if (!result.success) {
        const errorEmbed = new EmbedBuilder()
          .setColor(0xf43f5e)
          .setTitle(`❌ ${result.title}`)
          .setDescription(result.message)
          .setFooter({ text: 'ICpEP.SE Verification Gateway' });

        return interaction.editReply({ embeds: [errorEmbed] });
      }

      const successEmbed = new EmbedBuilder()
        .setColor(0x2563eb)
        .setTitle('✅ Verification Successful!')
        .setDescription(`Welcome to the ICpEP.SE Community, **${result.student.full_name}**!`)
        .addFields(
          { name: 'Student ID', value: `\`${result.student.student_id}\``, inline: true },
          { name: 'Course & Year', value: `${result.student.course} - ${result.student.year_level}`, inline: true },
          {
            name: 'Roles Granted',
            value: result.rolesAssigned.length > 0 ? result.rolesAssigned.join(', ') : 'Verified Member',
            inline: false,
          }
        )
        .setFooter({ text: 'ICpEP.SE Verification Gateway • Verified' })
        .setTimestamp();

      return interaction.editReply({ embeds: [successEmbed] });
    }
  }

  // --- C. Handle Slash Commands ---
  if (!interaction.isChatInputCommand()) return;

  const { commandName } = interaction;

  // 1. Command: /verify
  if (commandName === 'verify') {
    await interaction.deferReply({ ephemeral: true });

    const studentIdInput = interaction.options.getString('student_id');

    try {
      const result = await processStudentVerification({
        studentIdInput,
        discordUser: interaction.user,
        guild: interaction.guild,
        member: interaction.member,
      });

      if (!result.success) {
        const errorEmbed = new EmbedBuilder()
          .setColor(0xf43f5e)
          .setTitle(`❌ ${result.title}`)
          .setDescription(result.message)
          .setFooter({ text: 'ICpEP.SE Verification Gateway' });

        return interaction.editReply({ embeds: [errorEmbed] });
      }

      const successEmbed = new EmbedBuilder()
        .setColor(0x2563eb)
        .setTitle('✅ Verification Successful!')
        .setDescription(`Welcome to the ICpEP.SE Community, **${result.student.full_name}**!`)
        .addFields(
          { name: 'Student ID', value: `\`${result.student.student_id}\``, inline: true },
          { name: 'Course & Year', value: `${result.student.course} - ${result.student.year_level}`, inline: true },
          {
            name: 'Roles Granted',
            value: result.rolesAssigned.length > 0 ? result.rolesAssigned.join(', ') : 'Verified Member',
            inline: false,
          }
        )
        .setFooter({ text: 'ICpEP.SE Verification Gateway • Verified' })
        .setTimestamp();

      return interaction.editReply({ embeds: [successEmbed] });
    } catch (err) {
      console.error('Error executing /verify slash command:', err);
      return interaction.editReply({
        content: '⚠️ An unexpected error occurred while processing your verification. Please contact an officer.',
      });
    }
  }

  // 2. Command: /clear [amount]
  if (commandName === 'clear') {
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageMessages)) {
      return interaction.reply({
        content: '❌ You do not have permission to manage messages in this channel.',
        ephemeral: true,
      });
    }

    const amount = interaction.options.getInteger('amount');

    await interaction.deferReply({ ephemeral: true });

    try {
      const deletedMessages = await interaction.channel.bulkDelete(amount, true);

      return interaction.editReply({
        content: `🧹 **Successfully cleared ${deletedMessages.size} message(s)** from <#${interaction.channel.id}>. *(Messages older than 14 days cannot be bulk deleted by Discord).*`,
      });
    } catch (clearErr) {
      console.error('Error executing /clear command:', clearErr);
      return interaction.editReply({
        content: `⚠️ Failed to delete messages: ${clearErr.message}`,
      });
    }
  }

  // 3. Command: /post-verify-guide
  if (commandName === 'post-verify-guide') {
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({
        content: '❌ Only Administrators can post the official verification guide banner.',
        ephemeral: true,
      });
    }

    const shouldMentionUnverified = interaction.options.getBoolean('mention_unverified') ?? true;

    await interaction.deferReply({ ephemeral: true });

    try {
      const unverifiedRole = interaction.guild.roles.cache.find(r => r.name.toLowerCase() === 'unverified');
      const roleMentionText = unverifiedRole ? `${unverifiedRole}` : '@Unverified';

      // Build the exact message content matching the ICpEP.SE CIT - U Chapter banner
      const bannerContent =
        `**Welcome to the ICpEP.SE CIT - U Chapter Discord server!**\n\n` +
        `1️⃣ **Type your student ID in this channel.**\n\n` +
        `2️⃣ **If Bitzy can't verify your ID or is offline.** Wait for a moderator to verify or use reaction to get Verified role.\n\n` +
        `3️⃣ **Once verified**, you will have access to roles channel and rules which are required to read and do to access the rest of the server.\n\n` +
        (shouldMentionUnverified ? `${roleMentionText}` : '');

      // Optional quick-action button for users who prefer clicking to verify
      const actionRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('btn_open_verify_modal')
          .setLabel('Click Here to Verify Student ID')
          .setStyle(ButtonStyle.Primary)
          .setEmoji('🛡️')
      );

      const postedMessage = await interaction.channel.send({
        content: bannerContent,
        components: [actionRow],
      });

      // Add a checkmark reaction for visual clarity
      await postedMessage.react('✅').catch(() => {});

      return interaction.editReply({
        content: `✅ **Verification guide banner successfully posted** in <#${interaction.channel.id}>!`,
      });
    } catch (guideErr) {
      console.error('Error posting verification guide:', guideErr);
      return interaction.editReply({
        content: `⚠️ Failed to post guide: ${guideErr.message}`,
      });
    }
  }
});

// ------------------------------------------------------------------------------
// 7. Express Health Check Gateway (Prevents Render / Uptime sleeping & powers Web Status)
// ------------------------------------------------------------------------------
const app = express();
const PORT = process.env.PORT || 3000;

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

app.get('/', (req, res) => {
  const isReady = client.isReady();
  res.json({
    status: isReady ? 'online' : 'initializing',
    service: 'Bitzy Discord Bot Service',
    botUser: client.user ? client.user.tag : null,
    botId: client.user ? client.user.id : null,
    isReady,
    guilds: client.guilds ? client.guilds.cache.size : 0,
    ping: client.ws ? client.ws.ping : -1,
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

app.get('/health', (req, res) => {
  const isReady = client.isReady();
  res.status(isReady ? 200 : 503).json({
    status: isReady ? 'healthy' : 'unhealthy',
    ready: isReady,
    botUser: client.user ? client.user.tag : null,
    guilds: client.guilds ? client.guilds.cache.size : 0,
    ping: client.ws ? client.ws.ping : -1,
    uptimeSeconds: Math.floor(process.uptime()),
  });
});

app.listen(PORT, () => {
  console.log(`🌐 [Express] Uptime & Health Check server listening on port ${PORT}`);
});

// ------------------------------------------------------------------------------
// 8. Connect to Discord Gateway
// ------------------------------------------------------------------------------
const discordToken = process.env.DISCORD_TOKEN;
if (discordToken) {
  client.login(discordToken).catch(err => {
    console.error('❌ Failed to login to Discord:', err.message);
  });
} else {
  console.warn('⚠️ [Bitzy Bot] DISCORD_TOKEN is not set. Bot login skipped.');
}