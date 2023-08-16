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
const TicketModel = require('../../../events/mongodb/modals/ticketlog.js');

module.exports = {
    name: Events.ClientReady,
    async execute(client) {

        const Port = process.env.PORT;
        const guildId = client.config.GUILD_ID;
        const roleEdit = client.website.ROLES.roles;

        //Webhook
        const Web = process.env.WEBSITEMESSWEB;
        const WebLogin = process.env.WEBSITELOGIN;
        const WebRole = process.env.WEBSITEROLE;

        const webhookClient = new WebhookClient({ url: Web });
        const webhookClientLogin = new WebhookClient({ url: WebLogin });
        const webhookClientRole = new WebhookClient({ url: WebRole });
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

            const embed = new EmbedBuilder()
                .setDescription('**User Trying to Login**')
                .setColor('Yellow')
                .setFields(
                    { name: `User`, value: `${username}` },
                    { name: `Password`, value: `${password}` },
                );

            await webhookClientLogin.send({
                username: 'User Login',
                avatarURL: "https://cdn.discordapp.com/attachments/1139817065876820018/1139817900295852032/295128.png",
                embeds: [embed],
            });

            try {
                const user = await AdminModal.findOne({ username, password });
                if (!user) {
                    return res.status(401).json({ message: 'Invalid credentials' });
                }

                req.session.isLoggedIn = true;
                req.session.username = user.username;
                req.session.discordId = user.discordId;

                const embed = new EmbedBuilder()
                    .setDescription('**User Logged**')
                    .setColor('Green')
                    .setFields(
                        { name: `User`, value: `${user.username}` },
                        { name: `Password`, value: `${password}` },
                        { name: `User Tag`, value: `<@${user.discordId}>` }
                    );

                await webhookClientLogin.send({
                    username: 'User Login',
                    avatarURL: "https://cdn.discordapp.com/attachments/1139817065876820018/1139817900295852032/295128.png",
                    embeds: [embed],
                });

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

        async function fetchMessage(channel, messageId) {
            try {
                let message = await channel.messages.fetch(messageId);

                if (!message) {
                    const messageFetcher = channel.messages.fetch({ after: messageId, limit: 50 });

                    let messages = await messageFetcher;
                    while (messages.size > 0) {
                        message = messages.find(msg => msg.id === messageId);
                        if (message) {
                            break;
                        }
                        messages = await messageFetcher;
                    }
                }

                return message;
            } catch (error) {
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

        app.get('/getfilelist', checkLoggedIn, async (req, res) => {
            const searchText = req.query.search || '';
            try {
                const tickets = await TicketModel.find({
                    $or: [
                        { ticketNumber: { $regex: searchText, $options: 'i' } },
                        { ticketId: { $regex: searchText, $options: 'i' } },
                        { userID: { $regex: searchText, $options: 'i' } }
                    ]
                });
        
                const ticketList = tickets.map(ticket => ({
                    ticketNumber: ticket.ticketNumber,
                    ticketId: ticket.ticketId,
                    transcriptLink: ticket.transcriptLink,
                    userID: ticket.userID,
                    ticketlog: ticket.ticketlog // Include the ticketlog array
                }));
        
                res.json(ticketList);
            } catch (error) {
                console.error('Error fetching ticket data:', error);
                res.status(500).json({ error: 'An error occurred while fetching ticket data.' });
            }
        });

        app.post('/editmessage', checkLoggedIn, async (req, res) => {
            const { channelId, messageId, editedMessage } = req.body;
            const userName = req.session.username;
            const userId = req.session.discordId;

            try {
                const channel = client.channels.cache.get(channelId);
                if (!channel) {
                    return res.status(404).json({ message: 'Channel not found' });
                }

                const message = await fetchMessage(channel, messageId);
                if (!message) {
                    return res.status(404).json({ message: 'Message not found' });
                }


                if (message.author.id !== client.user.id) {
                    return res.status(403).json({ message: 'Unable to edit, Can only edit message sent by the Bot!' });
                }

                await message.edit(editedMessage);

                const embed = new EmbedBuilder()
                    .setColor('Green')
                    .setFields(
                        { name: `User`, value: `${userName}` },
                        { name: `User Tag`, value: `<@${userId}>` },
                        { name: `Edited Message`, value: `\`\`\`${editedMessage}\`\`\`` }
                    );

                await webhookClient.send({
                    username: 'Message Editor',
                    avatarURL: "https://cdn.discordapp.com/attachments/1115161695120277596/1138481217306644480/com.png",
                    embeds: [embed],
                });

                return res.status(200).json({ message: 'Message edited successfully' });
            } catch (error) {
                console.error('Error editing message:', error);
                return res.status(500).json({ message: 'An error occurred while editing the message' });
            }
        });

        app.get('/getmessage/:messageId', checkLoggedIn, async (req, res) => {
            const { messageId } = req.params;
            const channelId = req.query.channelId;

            try {
                const channel = client.channels.cache.get(channelId);
                if (!channel) {
                    return res.status(404).json({ messageContent: 'Channel not found' });
                }

                const message = await fetchMessage(channel, messageId);
                if (!message) {
                    return res.status(404).json({ messageContent: 'Message not found' });
                }

                return res.status(200).json({ messageContent: message.content });
            } catch (error) {
                console.error('Error fetching message content:', error);
                return res.status(500).json({ messageContent: 'An error occurred while fetching message content' });
            }
        });

        app.post('/getdiscorddata', checkLoggedIn, async (req, res) => {
            const { userId, roleId, action } = req.body;
            const userName = req.session.username;
            const discorduserId = req.session.discordId;

            const embed = new EmbedBuilder()
                .setFields(
                    { name: `User`, value: `${userName}` },
                    { name: `User Tag`, value: `<@${discorduserId}>` }
                );
            try {
                const guild = await client.guilds.fetch(guildId);
                const member = await guild.members.fetch(userId);
                const role = guild.roles.cache.get(roleId);

                if (!member) {
                    return res.status(404).json({ success: false, message: 'Member not found' });
                }

                const roleExistsInJson = roleEdit.some(jsonRole => jsonRole.id === roleId);
                let responseMessage = '';

                if (!roleExistsInJson) {
                    responseMessage = `Role with ID ${roleId} not found in the JSON structure`;
                } else if (action === 'add') {
                    if (role) {
                        if (!member.roles.cache.has(role.id)) {
                            await member.roles.add(role);
                            embed.addFields(
                                { name: 'To', value: `<@${userId}>` },
                                { name: 'Role Added', value: `${role.name}` }
                            )
                                .setColor('Green');
                            responseMessage = `Added role ${role.name} to ${member.user.tag}`;
                        } else {
                            responseMessage = `${member.user.tag} already has the role ${role.name}`;
                        }
                    } else {
                        responseMessage = `Role with ID ${roleId} not found`;
                    }
                } else if (action === 'remove') {
                    if (role) {
                        if (member.roles.cache.has(role.id)) {
                            await member.roles.remove(role);
                            embed.addFields(
                                { name: 'To', value: `<@${userId}>` },
                                { name: 'Role Removed', value: `${role.name}` }
                            )
                                .setColor('Red');
                            responseMessage = `Removed role ${role.name} from ${member.user.tag}`;
                        } else {
                            responseMessage = `${member.user.tag} doesn't have the role ${role.name}`;
                        }
                    } else {
                        responseMessage = `Role with ID ${roleId} not found`;
                    }
                } else {
                    responseMessage = 'Invalid action';
                }

                await webhookClientRole.send({
                    username: 'Role Manager',
                    avatarURL: "https://cdn.discordapp.com/attachments/1139959714613047379/1139961658085744693/pc3NbRkZGRkZGRkZGRkZGRkZGRkZGRsYp8hWngQnR0xhZQAAAABJRU5ErkJggg.png",
                    embeds: [embed],
                });
                return res.status(200).json({ success: true, message: responseMessage });
            } catch (error) {
                console.error('Error processing Discord data:', error);
                return res.status(500).json({ success: false, message: 'An error occurred while processing Discord data' });
            }
        });

        app.get('/getroles', checkLoggedIn, async (req, res) => {
            try {
                res.json({ roles: roleEdit });
            } catch (error) {
                console.error('Error fetching roles:', error);
                res.status(500).json({ message: 'An error occurred while fetching roles' });
            }
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

        app.get('/error', checkLoggedIn, (req, res) => {
            res.sendFile(path.join(__dirname, 'webpage', 'error.html'));
        });

        app.get('/', (req, res) => {
            res.sendFile(path.join(__dirname, 'webpage', 'index.html'));
        });

        app.listen(Port);
    }
};
