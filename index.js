// Import the discord.js library
const { Client, GatewayIntentBits, SlashCommandBuilder, REST, Routes, Partials } = require('discord.js');
require('dotenv').config({ path: './conf.env' }); // Load environment variables from conf.env file

// Load environment variables
const { BOT_TOKEN, CLIENT_ID, GUILD_ID, PASS_RED } = process.env;

// Configuration: Centralized IDs and messages
const config = {
    channels: {
        NORMAL_CHAT_ID: 'YOUR_NORMAL_CHAT_CHANNEL_ID', // Replace with your channel ID
        RULES_CHAT_ID: 'YOUR_RULES_CHAT_CHANNEL_ID',   // Replace with your channel ID
        REDDIT_UPLOAD_CHAT_ID: 'YOUR_REDDIT_UPLOAD_CHANNEL_ID', // Replace with your channel ID
        YOUTUBE_UPLOAD_CHAT_ID: 'YOUR_YOUTUBE_UPLOAD_CHANNEL_ID', // Replace with your channel ID
        WELCOME_CHAT_ID: 'YOUR_WELCOME_CHAT_CHANNEL_ID', // Replace with your channel ID
        FILE_TICKET_CHANNEL_ID: 'YOUR_FILE_TICKET_CHANNEL_ID', // Replace with your channel ID
        VERIFY_CHANNEL_ID: 'YOUR_VERIFY_CHANNEL_ID', // Replace with your channel ID for reaction roles
        AGE_ROLE_CHANNEL_ID: 'YOUR_AGE_ROLE_CHANNEL_ID', // Replace with your channel ID for age role selection
    },
    roles: {
        TRUE_ANGEL_ROLE_ID: 'YOUR_TRUE_ANGEL_ROLE_ID', // Replace with the role ID for "True Angel"
        AGE_13_ROLE_ID: 'YOUR_AGE_13_ROLE_ID', // Replace with the role ID for Age 13
        AGE_14_ROLE_ID: 'YOUR_AGE_14_ROLE_ID', // Replace with the role ID for Age 14
        AGE_15_ROLE_ID: 'YOUR_AGE_15_ROLE_ID', // Replace with the role ID for Age 15
        AGE_16_ROLE_ID: 'YOUR_AGE_16_ROLE_ID', // Replace with the role ID for Age 16
        AGE_17_ROLE_ID: 'YOUR_AGE_17_ROLE_ID', // Replace with the role ID for Age 17
        AGE_18_PLUS_ROLE_ID: 'YOUR_AGE_18_PLUS_ROLE_ID', // Replace with the role ID for Age 18+
    },
    messages: {
        BOT_ONLINE: 'BURGER BOT IS ONLINE :)',
        SUB_YOUTUBE: 'Sub to https://www.youtube.com/@VandalTecnoz', // Message for periodic posting
        INVALID_PASSWORD: 'Invalid password!',
        CHANNEL_NOT_FOUND: 'Channel not found.',
        RULES_MESSAGE: (id) => `READ THE RULES <#${id}>`,
        FILE_SHARE_INSTRUCTIONS: (id) => `
To share a file, please go to <#${id}> and create a ticket.

**File Specifications:**
- File size limit: 10 MB per file.
- Accepted file types: All types (e.g., image, HTML, etc.).
- The file will be verified once uploaded.

Once you have created the ticket, someone from the team will respond to you.
        `,
    },
};

// Helper function: Fetch and validate channels
const getChannel = (client, channelId) => client.channels.cache.get(channelId);

// Helper function: Send error-free messages
const sendChannelMessage = async (channel, content) => {
    if (!channel) {
        console.error(config.messages.CHANNEL_NOT_FOUND);
        return;
    }
    try {
        await channel.send(content);
    } catch (error) {
        console.error(`Error sending message to channel (${channel.id}):`, error);
    }
};

// Create a new Discord client instance
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.MessageContent,
    ],
    partials: [Partials.Message, Partials.Reaction, Partials.User], // Required for reaction events on uncached messages
});

// Bot ready event
client.once('ready', async () => {
    console.log(config.messages.BOT_ONLINE);

    const normalChannel = getChannel(client, config.channels.NORMAL_CHAT_ID);
    await sendChannelMessage(normalChannel, config.messages.BOT_ONLINE);

    // Post verification message
    const verifyChannel = getChannel(client, config.channels.VERIFY_CHANNEL_ID);
    if (verifyChannel) {
        const verifyMessage = await verifyChannel.send('React with 🍔 to verify and get the "True Angel" role!');
        await verifyMessage.react('🍔'); // Burger emoji
    } else {
        console.error('Verify channel not found.');
    }

    // Post age role message
    const ageRoleChannel = getChannel(client, config.channels.AGE_ROLE_CHANNEL_ID);
    if (ageRoleChannel) {
        const ageRoleMessage = await ageRoleChannel.send('React with the appropriate emoji to select your age role:\n🍔 for 13\n🍕 for 14\n🍟 for 15\n🌮 for 16\n🌯 for 17\n🌶️ for 18+');
        await ageRoleMessage.react('🍔'); // Age 13 role
        await ageRoleMessage.react('🍕'); // Age 14 role
        await ageRoleMessage.react('🍟'); // Age 15 role
        await ageRoleMessage.react('🌮'); // Age 16 role
        await ageRoleMessage.react('🌯'); // Age 17 role
        await ageRoleMessage.react('🌶️'); // Age 18+ role
    } else {
        console.error('Age role channel not found.');
    }

    // Start a 1-hour interval to send the subscription message
    setInterval(async () => {
        console.log('Sending YouTube subscription message...');
        await sendChannelMessage(normalChannel, config.messages.SUB_YOUTUBE);
    }, 60 * 60 * 1000); // 1 hour in milliseconds
});

// Reaction role event handlers
client.on('messageReactionAdd', async (reaction, user) => {
    if (reaction.message.channelId === config.channels.VERIFY_CHANNEL_ID && reaction.emoji.name === '🍔') {
        const guild = client.guilds.cache.get(GUILD_ID);
        const member = guild.members.cache.get(user.id);

        if (!member) {
            console.error('Member not found.');
            return;
        }

        try {
            const role = guild.roles.cache.get(config.roles.TRUE_ANGEL_ROLE_ID);
            await member.roles.add(role);
            console.log(`Added "True Angel" role to ${member.user.tag}.`);
        } catch (error) {
            console.error(`Failed to add role: ${error.message}`);
        }
    }

    // Handling age role selection
    if (reaction.message.channelId === config.channels.AGE_ROLE_CHANNEL_ID) {
        const guild = client.guilds.cache.get(GUILD_ID);
        const member = guild.members.cache.get(user.id);

        if (!member) {
            console.error('Member not found.');
            return;
        }

        try {
            // Remove all age roles before adding a new one
            const ageRoles = [
                config.roles.AGE_13_ROLE_ID,
                config.roles.AGE_14_ROLE_ID,
                config.roles.AGE_15_ROLE_ID,
                config.roles.AGE_16_ROLE_ID,
                config.roles.AGE_17_ROLE_ID,
                config.roles.AGE_18_PLUS_ROLE_ID,
            ];

            await member.roles.remove(ageRoles);

            if (reaction.emoji.name === '🍔') {
                await member.roles.add(config.roles.AGE_13_ROLE_ID);
                console.log(`Assigned 13 role to ${member.user.tag}.`);
            } else if (reaction.emoji.name === '🍕') {
                await member.roles.add(config.roles.AGE_14_ROLE_ID);
                console.log(`Assigned 14 role to ${member.user.tag}.`);
            } else if (reaction.emoji.name === '🍟') {
                await member.roles.add(config.roles.AGE_15_ROLE_ID);
                console.log(`Assigned 15 role to ${member.user.tag}.`);
            } else if (reaction.emoji.name === '🌮') {
                await member.roles.add(config.roles.AGE_16_ROLE_ID);
                console.log(`Assigned 16 role to ${member.user.tag}.`);
            } else if (reaction.emoji.name === '🌯') {
                await member.roles.add(config.roles.AGE_17_ROLE_ID);
                console.log(`Assigned 17 role to ${member.user.tag}.`);
            } else if (reaction.emoji.name === '🌶️') {
                await member.roles.add(config.roles.AGE_18_PLUS_ROLE_ID);
                console.log(`Assigned 18+ role to ${member.user.tag}.`);
            }
        } catch (error) {
            console.error(`Failed to assign age role: ${error.message}`);
        }
    }
});

client.on('messageReactionRemove', async (reaction, user) => {
    if (reaction.message.channelId === config.channels.VERIFY_CHANNEL_ID && reaction.emoji.name === '🍔') {
        const guild = client.guilds.cache.get(GUILD_ID);
        const member = guild.members.cache.get(user.id);

        if (!member) {
            console.error('Member not found.');
            return;
        }

        try {
            const role = guild.roles.cache.get(config.roles.TRUE_ANGEL_ROLE_ID);
            await member.roles.remove(role);
            console.log(`Removed "True Angel" role from ${member.user.tag}.`);
        } catch (error) {
            console.error(`Failed to remove role: ${error.message}`);
        }
    }

    // Handling age role unselection
    if (reaction.message.channelId === config.channels.AGE_ROLE_CHANNEL_ID) {
        const guild = client.guilds.cache.get(GUILD_ID);
        const member = guild.members.cache.get(user.id);

        if (!member) {
            console.error('Member not found.');
            return;
        }

        try {
            // Remove the selected age role when user unreacts
            const ageRoles = [
                config.roles.AGE_13_ROLE_ID,
                config.roles.AGE_14_ROLE_ID,
                config.roles.AGE_15_ROLE_ID,
                config.roles.AGE_16_ROLE_ID,
                config.roles.AGE_17_ROLE_ID,
                config.roles.AGE_18_PLUS_ROLE_ID,
            ];

            await member.roles.remove(ageRoles);
            console.log(`Removed all age roles from ${member.user.tag}.`);
        } catch (error) {
            console.error(`Failed to remove age role: ${error.message}`);
        }
    }
});

// Define slash commands
const commands = [
    new SlashCommandBuilder().setName('rules').setDescription('Displays the rules message.'),
    new SlashCommandBuilder()
        .setName('redditupload')
        .setDescription('Uploads a new Reddit post.')
        .addStringOption((option) =>
            option.setName('link').setDescription('Link to the new Reddit post').setRequired(true)
        )
        .addStringOption((option) =>
            option.setName('password').setDescription('Password to authorize the upload').setRequired(true)
        ),
    new SlashCommandBuilder()
        .setName('youtubeupload')
        .setDescription('Uploads a new YouTube video.')
        .addStringOption((option) =>
            option.setName('link').setDescription('Link to the new YouTube video').setRequired(true)
        )
        .addStringOption((option) =>
            option.setName('password').setDescription('Password to authorize the upload').setRequired(true)
        ),
    new SlashCommandBuilder().setName('art').setDescription('Displays art with a special message.'),
    new SlashCommandBuilder().setName('help').setDescription('Displays this help message.'),
    new SlashCommandBuilder().setName('hi').setDescription('Replies with a friendly greeting.'),
    new SlashCommandBuilder()
        .setName('fileshare')
        .setDescription('Instructs users to create a file share ticket and provides file upload limitations.'),
].map((command) => command.toJSON());

// Register slash commands
const rest = new REST({ version: '10' }).setToken(BOT_TOKEN);
rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands })
    .then(() => console.log('Successfully registered commands.'))
    .catch(console.error);

// Interaction handler
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isCommand()) return;

    const { commandName, options, member } = interaction;

    try {
        console.log(`Command used: /${commandName} by ${member.user.username}`);

        switch (commandName) {
            case 'rules': {
                const message = config.messages.RULES_MESSAGE(config.channels.RULES_CHAT_ID);
                await interaction.reply({ content: message, ephemeral: false });
                break;
            }
            case 'redditupload':
            case 'youtubeupload': {
                const link = options.getString('link');
                const password = options.getString('password');
                const targetChannelId =
                    commandName === 'redditupload'
                        ? config.channels.REDDIT_UPLOAD_CHAT_ID
                        : config.channels.YOUTUBE_UPLOAD_CHAT_ID;

                if (password !== PASS_RED) {
                    return interaction.reply({ content: config.messages.INVALID_PASSWORD, ephemeral: true });
                }

                const targetChannel = getChannel(client, targetChannelId);
                await sendChannelMessage(targetChannel, `@everyone NEW UPLOAD: ${link}`);
                await interaction.reply({ content: `${commandName} upload successful!`, ephemeral: true });
                break;
            }
            case 'art': {
                await interaction.reply('ART!!!!!!!!\n\n∧,,,∧\n(  ̳• · • ̳)\n/    づ♡');
                break;
            }
            case 'help': {
                await interaction.reply({
                    content: `
**Available Commands:**
- /rules - Displays the rules.
- /redditupload - Uploads a new Reddit post (password required).
- /youtubeupload - Uploads a new YouTube video (password required).
- /art - Displays a fun art message.
- /help - Displays this help message.
- /hi - Replies with a friendly greeting.
- /fileshare - Explains how to share files in the server.
                    `,
                    ephemeral: false, // Make it visible to everyone
                });
                break;
            }
            case 'hi': {
                await interaction.reply({ content: 'Hello there! 👋', ephemeral: false }); // Visible to all users
                break;
            }
            case 'fileshare': {
                const instructions = config.messages.FILE_SHARE_INSTRUCTIONS(config.channels.FILE_TICKET_CHANNEL_ID);
                await interaction.reply({ content: instructions, ephemeral: false }); // Visible to all users
                break;
            }
        }
    } catch (error) {
        console.error(`Error handling command (${commandName}):`, error);
        await interaction.reply({ content: 'An error occurred while processing your command.', ephemeral: true });
    }
});

// Member join event
client.on('guildMemberAdd', async (member) => {
    const welcomeChannel = getChannel(client, config.channels.WELCOME_CHAT_ID);
    await sendChannelMessage(welcomeChannel, `@everyone ${member.user.username} JOINED`);
});

// Log in to Discord
client.login(BOT_TOKEN);
