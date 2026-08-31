/**
 * ==============================================================================
 * Bitzy Discord Bot - Unified Monorepo Service
 * ==============================================================================
 * Features:
 *  - Supabase Database Integration (Zero Google Sheets dependencies)
 *  - Dual Verification Mode:
 *      1. Modern Slash Command: /verify <student_id> (Ephemeral, private)
 *      2. Resilient Channel Listener: Direct ID entry in #verify (Auto-deleting)
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
  ActivityType,
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
  ],
  partials: [Partials.Channel, Partials.GuildMember, Partials.User],
});

// Anti-spam cooldown map: userId -> lastTimestamp (ms)
const userCooldown = new Map();
const COOLDOWN_MS = 5000;

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
// Core Verification Service Logic (Shared by Slash Command and Message Listener)
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
      // Primary verified roles to grant (checks for both standard and specific role names)
      const primaryRoleCandidates = ['ka-CpE', 'ICpEP.SE Verified Member', 'Verified Member'];
      for (const candidate of primaryRoleCandidates) {
        const role = guild.roles.cache.find(r => r.name.toLowerCase() === candidate.toLowerCase());
        if (role) {
          await member.roles.add(role).catch(err => {
            console.warn(`[Role Assignment Warn] Could not assign ${role.name}: ${err.message}`);
          });
          assignedRoleNames.push(role.name);
          break; // Assign the first matching primary role
        }
      }

      // Course-specific role assignment if present in server
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
          // Typically fails if user is server owner or has higher role hierarchy than bot
          console.log(`[Nickname Sync] Skipped nickname update for ${discordUser.username} (${err.message})`);
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
// 3. Event: Bot Ready
// ------------------------------------------------------------------------------
client.once('ready', () => {
  console.log(`=======================================================`);
  console.log(`🤖 Bitzy Discord Bot is ONLINE as ${client.user.tag}`);
  console.log(`🌐 Serving ${client.guilds.cache.size} server(s)`);
  console.log(`📊 Connected to Supabase: ${supabaseUrl}`);
  console.log(`=======================================================`);

  client.user.setPresence({
    activities: [{ name: 'for student IDs in #verify', type: ActivityType.Watching }],
    status: 'online',
  });
});

// ------------------------------------------------------------------------------
// 4. Event: Guild Member Add (Auto-welcome & Unverified Role)
// ------------------------------------------------------------------------------
client.on('guildMemberAdd', async member => {
  try {
    // 1. Assign Unverified role
    const unverifiedRole = member.guild.roles.cache.find(r => r.name.toLowerCase() === 'unverified');
    if (unverifiedRole) {
      await member.roles.add(unverifiedRole).catch(err => {
        console.warn(`[Auto-Role] Could not assign Unverified role: ${err.message}`);
      });
    }

    // 2. Send welcome prompt in #verify channel
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
  // Ignore bot messages and non-guild messages
  if (message.author.bot || !message.guild) return;

  // Only listen in channels named 'verify'
  if (message.channel.name.toLowerCase() !== 'verify') return;

  // Rate-limiting check (5s per user)
  const now = Date.now();
  const lastAttempt = userCooldown.get(message.author.id) || 0;

  if (now - lastAttempt < COOLDOWN_MS) {
    await message.delete().catch(() => {});
    return;
  }
  userCooldown.set(message.author.id, now);

  const studentIdInput = message.content.trim();

  try {
    // Process verification
    const result = await processStudentVerification({
      studentIdInput,
      discordUser: message.author,
      guild: message.guild,
      member: message.member,
    });

    if (!result.success) {
      const errorEmbed = new EmbedBuilder()
        .setColor(0xf43f5e) // Rose/Red
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

    // Success response
    const successEmbed = new EmbedBuilder()
      .setColor(0x10b981) // Emerald Green
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
// 6. Event: Interaction Create (Modern Slash Command /verify)
// ------------------------------------------------------------------------------
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'verify') {
    // Ephemeral response ensures only the user can see their verification details
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
});

// ------------------------------------------------------------------------------
// 7. Express Health Check Gateway (Prevents Render / Uptime sleeping & powers Web Status)
// ------------------------------------------------------------------------------
const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS for web status checks
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