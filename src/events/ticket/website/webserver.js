const express = require('express');
const app = express();
app.set('trust proxy', 1);
require("dotenv").config();
const { Events, ChannelType, WebhookClient, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const session = require('express-session');
const { v4: uuidv4 } = require('uuid');
const rateLimit = require('express-rate-limit');
const cors = require('cors');

const AdminModal = require('../../../events/mongodb/modals/adminLogin.js');
const CACHE_EXPIRATION_TIME = 5 * 60 * 1000;

module.exports = {
    name: Events.ClientReady,
    async execute(client) {

        const Port = process.env.PORT;
        const guildId = "1096848188935241878";//client.config.GUILD_ID;
        const Web = process.env.WEBSITEMESSWEB;

        const webhookClient = new WebhookClient({ url: Web });
        //app.use(require('morgan')('dev'));

        // CSS JS JSON CORS -----------------------------------------------

        app.use(express.json());
        app.use('/css', express.static(path.join(__dirname, 'webpage', 'css')));
        app.use('/js', express.static(path.join(__dirname, 'webpage', 'js')));

        // CORS ------------------------------------------------------

        const corsOptions = {
            origin: ['https://iconicticket.muralianand.in',
                'https://muralianand.in',
                'http://localhost:5002'],
            methods: 'GET,POST',
            optionsSuccessStatus: 204,
        };
        app.use(cors(corsOptions));


        // Ticket File Count ------------------------------------------------------

        const ticketLogDir = path.join(__dirname, './ticket-logs');
        app.use(express.static(ticketLogDir));
        app.get('/filecount', (req, res) => {
            fs.readdir(ticketLogDir, (err, files) => {
                if (err) {
                    console.error('Error reading directory:', err);
                    res.status(500).json({ error: 'Failed to read directory.' });
                } else {
                    const fileCount = files.length;
                    res.json({ fileCount });
                }
            });
        });

        //LOGIN LOGIC --------------------------------------------------------------

        const secretKey = uuidv4();
        app.use(session({
            secret: secretKey,
            resave: false,
            saveUninitialized: true,
            cookie: { secure: false },
        }));

        const limiter = rateLimit({
            windowMs: 15 * 60 * 1000,
            max: 5,
            message: { message: 'Too many login attempts, please try again later.' }
        });

        app.post('/login', limiter, async (req, res) => {
            const { username, password } = req.body;

            try {
                const user = await AdminModal.findOne({ username, password });
                if (!user) {
                    return res.status(401).json({ message: 'Invalid credentials' });
                }

                req.session.isLoggedIn = true;
                req.session.username = user.username;
                req.session.discordId = user.discordId;
                return res.status(200).json({ message: 'Success' });
            } catch (error) {
                console.error('Error during authentication:', error);
                res.redirect('/error');
            }
        });

        // Functions ---------------------------------------------------------------------------

        function checkLoggedIn(req, res, next) {
            if (req.session.isLoggedIn) {
                next();
            } else {
                res.redirect('/login');
            }
        }

        async function fetchMessageContentFromDiscord(guildId, messageId) {
            try {
                const guild = await client.guilds.fetch(guildId);
                const channel = await findChannelWithMessage(guild, messageId);
                if (!channel) return null;

                const message = await channel.messages.fetch(messageId);
                return message.content;
            } catch (error) {
                console.error('Error fetching message content from Discord:', error);
                return null;
            }
        }

        async function editAndSendEditedMessageToDiscord(guildId, messageId, editedMessage) {
            try {
                const guild = await client.guilds.fetch(guildId);
                const channel = await findChannelWithMessage(guild, messageId);
                if (!channel) return false;

                const message = await channel.messages.fetch(messageId);
                await message.edit(editedMessage);
                return true;
            } catch (error) {
                console.error('Error editing and sending message to Discord:', error);
                return false;
            }
        }

        async function findChannelWithMessage(guild, messageId) {
            try {
                const channels = guild.channels.cache;
                for (const [channelId, channel] of channels) {
                    try {
                        const message = await channel.messages.fetch(messageId);
                        if (message) {
                            return channel;
                        }
                    } catch (error) {
                        // Message not found in this channel, continue searching
                    }
                }
                return null;
            } catch (error) {
                console.error('Error finding channel with message:', error);
                return null;
            }
        }

        // APIS ---------------------------------------------------------------------------

        app.get('/getprofile', checkLoggedIn, async (req, res) => {

            try {
                const user = await AdminModal.findOne({ username: req.session.username });
                if (!user) {
                    return res.status(404).json({ message: 'User not found' });
                }

                const profileInfo = {
                    discordUsername: user.discordUsername,
                    discordId: user.discordId,
                    discordAvatar: user.discordAvatar,
                };

                return res.status(200).json(profileInfo);
            } catch (error) {
                console.error('Error fetching profile information:', error);
                return res.status(500).json({ message: 'An error occurred while fetching profile information' });
            }
        });

        app.get('/getchannels', checkLoggedIn, async (req, res) => {

            try {
                const guild = await client.guilds.fetch(guildId);
                await guild.channels.fetch();
                const channels = [];

                guild.channels.cache.forEach(channel => {
                    if (channel.type === ChannelType.GuildText || channel.type === ChannelType.GuildAnnouncement || channel.type === ChannelType.GuildVoice) {
                        channels.push({ id: channel.id, name: channel.name });
                    }
                });

                res.json(channels);
            } catch (error) {
                console.error('Error fetching channels:', error);
                res.status(500).json({ message: 'An error occurred while fetching channels' });
            }
        });

        app.post('/sendmessage', checkLoggedIn, async (req, res) => {
            const { channelId, message } = req.body;
            const userName = req.session.username;
            const userId = req.session.discordId;
            try {
                const channel = client.channels.cache.get(channelId);
                if (!channel) {
                    return res.status(404).json({ message: 'Channel not found' });
                }
                const embed = new EmbedBuilder()
                    .setColor('Red')
                    .setFields(
                        { name: `User`, value: `${userName}` },
                        { name: `User Tag`, value: `<@${userId}>` },
                    );

                if (message.length <= 1000) {
                    await channel.send(message);
                    embed.addFields({ name: `Message`, value: `\`\`\`${message}\`\`\`` });
                } else {
                    const chunks = message.match(/[\s\S]{1,1000}/g);
                    let accumulatedContent = '';
                    for (const chunk of chunks) {
                        await channel.send(chunk);
                        accumulatedContent += chunk;
                    }
                    const fieldChunks = accumulatedContent.match(/[\s\S]{1,1000}/g);
                    fieldChunks.forEach((fieldChunk, index) => {
                        const fieldName = index === 0 ? `Message (Part ${index + 1})` : `... (Part ${index + 1})`;
                        embed.addFields({ name: fieldName, value: `\`\`\`${fieldChunk}\`\`\`` });
                    });
                }
                await webhookClient.send({
                    username: 'Message Sender',
                    avatarURL: "https://cdn.discordapp.com/attachments/1115161695120277596/1138481217306644480/com.png",
                    embeds: [embed],
                });
                return res.status(200).json({ message: 'Message sent successfully' });
            } catch (error) {
                console.error('Error sending message:', error);
                return res.status(500).json({ message: 'An error occurred while sending the message' });
            }
        });

        app.get('/getmessage/:messageId', checkLoggedIn, async (req, res) => {
            const messageId = req.params.messageId;
            const guildId = client.config.GUILD_ID;

            try {
                const messageContent = await fetchMessageContentFromDiscord(guildId, messageId);
                console.log(`messageContent: ${messageContent}`)

                if (messageContent) {
                    res.json({ messageContent });
                } else {
                    res.status(404).json({ message: 'Message not found' });
                }
            } catch (error) {
                console.error('Error fetching message content:', error);
                res.status(500).json({ message: 'An error occurred while fetching message content' });
            }
        });

        app.post('/editmessage/:messageId', checkLoggedIn, async (req, res) => {
            const messageId = req.params.messageId;
            const { editedMessage } = req.body;
            const guildId = client.config.GUILD_ID;

            try {
                const success = await editAndSendEditedMessageToDiscord(guildId, messageId, editedMessage);

                if (success) {
                    res.status(200).json({ message: 'Message edited and sent successfully' });
                    const userName = req.session.username;
                    const userId = req.session.discordId;

                    const embed = new EmbedBuilder()
                        .setColor('Red')
                        .setFields(
                            { name: `User`, value: `${userName}` },
                            { name: `User Tag`, value: `<@${userId}>` },
                            { name: `Message`, value: `\`\`\`${editedMessage}\`\`\`` }
                        )
                    await webhookClient.send({
                        username: 'Message Editor',
                        avatarURL: "https://cdn.discordapp.com/attachments/1115161695120277596/1138480267103830188/AbxxAGSCqJc5Q23MNn_DZQwHO0IepUI-7d_014MUe096JJnTb_eWF_HCPG6N-jF3DArw.png",
                        embeds: [embed],
                    });

                } else {
                    res.status(500).json({ message: 'Failed to edit and send message' });
                }
            } catch (error) {
                console.error('Error editing and sending message:', error);
                res.status(500).json({ message: 'An error occurred while editing and sending message' });
            }
        });

        app.get('/getfilelist', checkLoggedIn, (req, res) => {
            const ticketLogDir = path.join(__dirname, 'ticket-logs');
            fs.readdir(ticketLogDir, (err, files) => {
                if (err) {
                    console.error('Error reading directory:', err);
                    //res.status(500).json({ error: 'Failed to read directory.' });
                    res.redirect('/error');
                } else {
                    const htmlFiles = files.filter(file => file.endsWith('.html'));
                    res.json(htmlFiles);
                }
            });
        });

        // ================================================================================

        app.get('/logout', (req, res) => {
            req.session.isLoggedIn = false;
            res.redirect('/login');
        });

        app.get('/login', (req, res) => {
            res.sendFile(path.join(__dirname, 'webpage', 'login.html'));
        });

        app.get('/admin', checkLoggedIn, (req, res) => {
            res.sendFile(path.join(__dirname, 'webpage', 'admin.html'));
        });

        app.get('/ticket', checkLoggedIn, (req, res) => {
            res.sendFile(path.join(__dirname, 'webpage', 'ticket.html'));
        });

        app.get('/error', (req, res) => {
            res.sendFile(path.join(__dirname, 'webpage', 'error.html'));
        });

        app.get('/', (req, res) => {
            res.sendFile(path.join(__dirname, 'webpage', 'index.html'));
        });

        app.listen(Port);
    }
};
