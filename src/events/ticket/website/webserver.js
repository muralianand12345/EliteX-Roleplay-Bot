const express = require('express');
const app = express();
require("dotenv").config();
const { Events, ChannelType } = require('discord.js');
const fs = require('fs');
const path = require('path');
const session = require('express-session');
const { v4: uuidv4 } = require('uuid');
const rateLimit = require('express-rate-limit');

const AdminModal = require('../../../events/mongodb/modals/adminLogin.js');

module.exports = {
    name: Events.ClientReady,
    async execute(client) {
        const Port = process.env.PORT;

        const guildId = client.config.GUILD_ID;

        const ticketLogDir = path.join(__dirname, './ticket-logs');
        //app.use(require('morgan')('dev'));
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

        app.use(express.json());

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

        app.post('/login', async (req, res) => {
            const { username, password } = req.body;

            try {
                const user = await AdminModal.findOne({ username, password });
                if (!user) {
                    return res.status(401).json({ message: 'Invalid credentials' });
                }

                req.session.isLoggedIn = true;
                req.session.username = user.username;
                return res.status(200).json({ message: 'Success' });
            } catch (error) {
                console.error('Error during authentication:', error);
                res.redirect('/error');
            }
        });

        //---------------------------------------------------------------------------

        function checkLoggedIn(req, res, next) {
            if (req.session.isLoggedIn) {
                next();
            } else {
                res.redirect('/login');
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
            try {
                const channel = client.channels.cache.get(channelId);
                if (!channel) {
                    return res.status(404).json({ message: 'Channel not found' });
                }

                if (message.length <= 1500) {
                    await channel.send(message);
                } else {
                    const chunks = message.match(/[\s\S]{1,1500}/g);
                    for (const chunk of chunks) {
                        await channel.send(chunk);
                    }
                }

                return res.status(200).json({ message: 'Message sent successfully' });
            } catch (error) {
                console.error('Error sending message:', error);
                return res.status(500).json({ message: 'An error occurred while sending the message' });
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

        app.get('/error', (req, res) => {
            res.sendFile(path.join(__dirname, 'webpage', 'error.html'));
        });

        app.get('/', (req, res) => {
            res.sendFile(path.join(__dirname, 'webpage', 'index.html'));
        });

        app.listen(Port);
    }
};
